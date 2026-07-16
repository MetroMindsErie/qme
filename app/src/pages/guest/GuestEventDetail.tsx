/**
 * Guest: Event detail page — live queues + informational activity cards.
 * Redesigned for I-Pitch demo: Live badge, stats bar, clickable menus.
 */
import { useEffect, useState, useCallback, type KeyboardEvent, type MouseEvent } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getEventBySlug } from '../../lib/eventService';
import { getActiveTicketCountForQueue, listQueuePilotTickets, listQueuesForEvent, getNowServing, restoreTicketForQueue, getQueueTicket } from '../../lib/queueService';
import { listActiveEcesForEvent } from '../../lib/eceService';
import { getEventCheckIn } from '../../lib/checkInService';
import { getEventCheckInConfig } from '../../lib/eventConfig';
import { getGuestCreditForCheckIn } from '../../lib/guestCreditService';
import { clearGuestStateAfterEventReset, getEventTestDataResetMarker } from '../../lib/guestResetService';
import { formatTime } from '../../lib/utils';
import { getStoredQueueTicket, getStoredQueueTicketNumber, clearQueueTicket } from '../../hooks/useQueueTicket';
import MenuModal, { type MenuConfig } from '../../components/MenuModal';
import type { Ece, EventCheckIn, QEvent, Queue, Ticket } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';
import '../../styles/eventDetail.css';

interface QueueWithMeta extends Queue {
  _myTicket?: string;
  _myStage?: Ticket['stage'];
  _nowServing?: number;
  _waitingCount?: number;
}

type CreditStatus = 'none' | 'available' | 'used';

function isGroupOrderEce(ece: Ece): boolean {
  return ece.metadata?.interaction_mode === 'group_order';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function hasSameShape(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getEceHomeSection(ece: Ece): string {
  const metadata = asRecord(ece.metadata);
  return asString(metadata.home_section || metadata.homeSection);
}

function isEceHomeVisible(ece: Ece): boolean {
  const metadata = asRecord(ece.metadata);
  return metadata.home_visible !== false && metadata.homeVisible !== false;
}

function getEceHomeSectionTitle(ece: Ece): string {
  const metadata = asRecord(ece.metadata);
  return asString(metadata.home_section_title || metadata.homeSectionTitle || metadata.home_section || metadata.homeSection);
}

function getEceHomeSectionOrder(ece: Ece): number {
  const metadata = asRecord(ece.metadata);
  return asNumber(metadata.home_section_order || metadata.homeSectionOrder) ?? 100;
}

function getEceHomeBadge(ece: Ece): string {
  const metadata = asRecord(ece.metadata);
  return asString(metadata.home_badge || metadata.homeBadge);
}

function getEceHomeActionLabel(ece: Ece): string {
  const metadata = asRecord(ece.metadata);
  return asString(metadata.home_action_label || metadata.homeActionLabel);
}

function getEceHomeUrl(ece: Ece): string {
  const metadata = asRecord(ece.metadata);
  return asString(metadata.home_url || metadata.homeUrl || metadata.url);
}

function shouldHideEceHomeHeader(ece: Ece): boolean {
  const metadata = asRecord(ece.metadata);
  return metadata.home_hide_card_header === true || metadata.homeHideCardHeader === true;
}

function getEceHomeIconVariant(ece: Ece): string {
  const metadata = asRecord(ece.metadata);
  return asString(metadata.home_icon_variant || metadata.homeIconVariant);
}

function getEceHomeItemsLayout(ece: Ece): string {
  const metadata = asRecord(ece.metadata);
  return asString(metadata.home_items_layout || metadata.homeItemsLayout);
}

function getEceHomeItemLimit(ece: Ece): number {
  const metadata = asRecord(ece.metadata);
  const configured = asNumber(metadata.home_items_limit || metadata.homeItemsLimit);
  if (!configured) return 4;
  return Math.min(Math.max(Math.floor(configured), 1), 10);
}

type HomeItemDetail = {
  label: string;
  value: string;
  color: string;
};

type HomeItem = {
  title: string;
  meta: string;
  note: string;
  imageUrl: string;
  imageVariant: string;
  url: string;
  details: HomeItemDetail[];
  detailsMode: string;
};

function getHomeItemDetails(value: unknown): HomeItemDetail[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((detail) => {
      const record = asRecord(detail);
      return {
        label: asString(record.label || record.title || record.name),
        value: asString(record.value || record.meta || record.note || record.description),
        color: asString(record.color),
      };
    })
    .filter((detail) => detail.label || detail.value || detail.color);
}

function getEceHomeItems(ece: Ece): HomeItem[] {
  const metadata = asRecord(ece.metadata);
  const rawItems = Array.isArray(metadata.home_items)
    ? metadata.home_items
    : Array.isArray(metadata.homeItems)
    ? metadata.homeItems
    : [];

  return rawItems
    .map((item) => {
      const record = asRecord(item);
      return {
        title: asString(record.title || record.name),
        meta: asString(record.meta || record.time || record.subtitle),
        note: asString(record.note || record.description),
        imageUrl: asString(record.image_url || record.imageUrl),
        imageVariant: asString(record.image_variant || record.imageVariant),
        url: asString(record.url || record.href || record.link_url || record.linkUrl),
        details: getHomeItemDetails(record.details || record.items),
        detailsMode: asString(record.detail_presentation || record.detailPresentation || record.details_mode || record.detailsMode),
      };
    })
    .filter((item) => item.title || item.meta || item.note || item.imageUrl || item.url || item.details.length)
    .slice(0, getEceHomeItemLimit(ece));
}

function getSectionedEces(eces: Ece[]): Array<{ key: string; title: string; order: number; eces: Ece[] }> {
  const hasConfiguredSections = eces.some((ece) => getEceHomeSection(ece));
  const fallbackTitle = hasConfiguredSections ? 'Featured Experiences' : '';
  const groups = new Map<string, { key: string; title: string; order: number; eces: Ece[] }>();

  eces.forEach((ece) => {
    const key = getEceHomeSection(ece) || 'default';
    const title = getEceHomeSectionTitle(ece) || fallbackTitle;
    const order = getEceHomeSectionOrder(ece);
    const current = groups.get(key);
    if (current) {
      current.eces.push(ece);
      current.order = Math.min(current.order, order);
      if (!current.title && title) current.title = title;
      return;
    }
    groups.set(key, { key, title, order, eces: [ece] });
  });

  return Array.from(groups.values()).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function queueStageStatus(stage?: Ticket['stage']): string {
  switch (stage) {
    case 'standby':
      return 'Gathering';
    case 'released':
      return 'Your turn';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'left':
      return 'Left queue';
    case 'waiting':
    default:
      return 'Waiting';
  }
}

function queueCardStatusLine(options: {
  hasTicket: boolean;
  stage?: Ticket['stage'];
  creditUsed: boolean;
  participationLocked: boolean;
  creditLocked: boolean;
  joinPaused: boolean;
}): string {
  if (options.creditUsed || options.stage === 'completed') return 'Completed';
  if (options.hasTicket) return `inQ · ${queueStageStatus(options.stage)}`;
  if (options.participationLocked) return 'Check-in required';
  if (options.creditLocked) return 'Photo credit required';
  if (options.joinPaused) return 'Paused';
  return 'Active';
}

// ── Static informational activities ─────────────────────────────────────────

interface StaticActivity {
  id: string;
  icon: string;
  color: string;
  name: string;
  description: string | null;
  time: string | null;
  badge: string | null;
  imageUrl?: string;
  menuConfig?: MenuConfig;
}

const PEONY_EVENT_SLUG = 'peony-festival';

const PICK_YOUR_OWN_MENU: MenuConfig = {
  id: 'pick-your-own',
  icon: 'P',
  color: '#7CB342',
  title: 'Pick Your Own Peonies',
  availability: 'You-Pick availability depends on bloom timing and weather.',
  gallery: ['/images/pick-your-own.jpeg'],
  items: [
    { emoji: '1', name: 'Will there be rows of open blooms?', note: 'Walnut Ridge is a working peony farm. Blooms are harvested just before they open, ideally in the marshmallow phase, for longest vase life.', imageUrl: '/images/pick-your-own.jpeg' },
    { emoji: '2', name: 'What visitors may see', note: 'The commercial patch has about 1,200 plants and is actively harvested. If timing unfolds perfectly, visitors may see blooms in the field or have a chance to You-Pick.', imageUrl: '/images/pick-your-own.jpeg' },
    { emoji: '3', name: 'Is You-Pick guaranteed?', note: 'Nothing is for sure with farming. Peonies are weather dependent and this part of the festival is at the mercy of mother nature.', imageUrl: '/images/pick-your-own.jpeg' },
    { emoji: '4', name: '$1 End-of-Season Stems', note: 'Special notice: take advantage of $1 end-of-season You-Pick stems. Flowers may have shorter vase life, but it is a beautiful field pick experience.', imageUrl: '/images/pick-your-own.jpeg' },
    { emoji: '5', name: 'Festival & Flowers Bouquet', note: 'Festival & Flowers ticket holders can choose to pick their own bouquet in the field or choose stems from the bouquet bar.', imageUrl: '/images/pick-your-own.jpeg' },
    { emoji: '6', name: 'Adding More Stems', note: 'If you want to add more after you pick, choose from pre-harvested stems at the bouquet bar. Additional peonies are $4 per stem.', imageUrl: '/images/pick-your-own.jpeg' },
  ],
};

const LIVE_MUSIC_MENU: MenuConfig = {
  id: 'live-music',
  icon: 'M',
  color: '#2196F3',
  title: 'Live Music',
  availability: 'Music details can be updated during the festival.',
  gallery: ['/images/Jason-and-Lauren.jpg', '/images/peony-festival-updates.jpg'],
  items: [
    { emoji: '1', name: 'Live Music Schedule', note: 'Performer names and times can be added as they are confirmed.', imageUrl: '/images/Jason-and-Lauren.jpg' },
    { emoji: '2', name: 'Where to Listen', note: 'Use this panel for stage/location updates during the festival.', imageUrl: '/images/peony-festival-updates.jpg' },
    { emoji: '3', name: 'Festival Atmosphere', note: 'A quick place to highlight music, announcements, and gathering times.', imageUrl: '/images/woman-on-back-with-peony.webp' },
  ],
};

const VENDOR_MARKET_MENU: MenuConfig = {
  id: 'vendor-market',
  icon: 'V',
  color: '#00A86B',
  title: 'Vendor Market',
  availability: 'Shop local makers and festival vendors.',
  gallery: [
    '/images/handcraft1.jpg',
    '/images/handcraft6.jpg',
    '/images/handcraft10.jpg',
    '/images/handcraft14.jpg',
    '/images/handcraft20.jpg',
    '/images/handcraft24.jpg',
    '/images/handcraft30.jpg',
    '/images/handcraft34.jpg',
    '/images/food1.jpg',
    '/images/food3.jpg',
    '/images/furniture-sponsor.jpg',
    '/images/tubar.jpg',
  ],
  items: [
    { emoji: 'A', name: 'Drift Market', note: 'Hand-crafted beaded necklaces, floral frames, trays, bronze charms, and a one-of-a-kind charm bar. @drift_._market', imageUrl: '/images/handcraft1.jpg' },
    { emoji: 'B', name: 'Wild & Co.', note: 'Hand-stamped custom jewelry in gold filled, brass, sterling silver, and rose gold. Custom-fit welded chains available. @_wildandco_', imageUrl: '/images/handcraft6.jpg' },
    { emoji: 'C', name: 'Serene Design Co.', note: 'Polymer clay earrings, necklaces, keychains, magnets, bookmarks, framed art, sun catchers, and hats. @serenedesignco', imageUrl: '/images/handcraft10.jpg' },
    { emoji: 'D', name: 'Wildflower Wurld', note: 'Hand-embroidered wildflower-inspired apparel and accessories with a signature wildflower stitch. @wildflowerwurld', imageUrl: '/images/handcraft14.jpg' },
    { emoji: 'E', name: 'The Quirky Snail', note: 'Heirloom jackets, vests, accessories, and wearables sewn from repurposed vintage quilts. @thequirkysnail', imageUrl: '/images/handcraft20.jpg' },
    { emoji: 'F', name: 'Dandelion & Thread', note: 'Keychains, earrings, baby sweaters, birthday onesies, hats, beanies, and framed treasures. @dandelion.and.thread', imageUrl: '/images/handcraft24.jpg' },
    { emoji: 'G', name: 'Sterling Candle Company', note: 'Hand-poured soy candles from Sterling, Ohio. @sterlingcandlecompany', imageUrl: '/images/handcraft30.jpg' },
    { emoji: 'H', name: 'Falcon Grove Studio', note: 'Original watercolor paintings transferred onto textiles, tea towels, and cushions. Watch Ana-Joel paint live. @falcongrovestudio', imageUrl: '/images/handcraft34.jpg' },
    { emoji: 'I', name: '1720 Wood', note: 'Food-safe cutting boards, coffee tables, charcuterie boards, and live-edge pieces; 50% of sales donated to local faith-based agencies. @1720_wood', imageUrl: '/images/furniture-sponsor.jpg' },
    { emoji: 'J', name: 'Green Cottage Makery', note: 'Earth-minded home and body care, Heritage Castle Soap, herbs, clays, and essential oils. @greencottagemakery', imageUrl: '/images/handcraft36.jpg' },
    { emoji: 'K', name: 'Revival Cloth + Co.', note: 'Cozy graphic tees, DIY custom sunglasses, hair-clip bar, and layering shackets. @revivalclothandco', imageUrl: '/images/handcraft37.jpg' },
    { emoji: 'L', name: 'Blend of Grace Coffee', note: 'Specialty espresso drinks, cold brew, teas, spritzers, and real fruit smoothies. @blendofgrace', imageUrl: '/images/food1.jpg' },
    { emoji: 'M', name: '444 Hibachi Grill', note: 'Hibachi chicken, steak, shrimp, and more, made fresh with big flavor. 444 Hibachi Grill', imageUrl: '/images/food3.jpg' },
    { emoji: 'N', name: 'Cowgirl Creamy', note: 'Ice cream, milkshakes, frozen dipped bananas, and cold coffee treats.', imageUrl: '/images/food4.jpg' },
    { emoji: 'O', name: "Ruby's", note: 'Chipotle chicken bowls, tacos, mahi mahi bowls, smoked brisket, Philly steak and cheese, and quesadillas.', imageUrl: '/images/food5.jpg' },
    { emoji: 'P', name: 'Thunderhead Pines Mobile Bar', note: 'The beautiful mobile bar welcomes guests each year as the festival ticket booth. @thunderheadpines', imageUrl: '/images/tubar.jpg' },
  ],
};

const PHOTO_OPS_MENU: MenuConfig = {
  id: 'photo-ops',
  icon: 'P',
  color: '#E91E63',
  title: 'Photo Ops',
  availability: 'Explore photo spots around the farm.',
  gallery: [
    '/images/woman-on-back-with-peony.webp',
    '/images/pick-your-own.jpeg',
    '/images/furniture-sponsor.jpg',
    '/images/flower-photos.webp',
    '/images/market-fresh-peonies.png',
  ],
  items: [
    { emoji: '1', name: 'Antiques Photo Op', note: 'Styled antique and vintage pieces make a charming festival photo spot. Sponsored feature area.', imageUrl: '/images/furniture-sponsor.jpg' },
    { emoji: '2', name: 'Flower Basket Photo Op', note: 'Photo opportunity with the flower basket.', imageUrl: '/images/market-fresh-peonies.png' },
    { emoji: '3', name: 'Field Photo Op', note: 'Photos in the peony field.', imageUrl: '/images/pick-your-own.jpeg' },
    { emoji: '4', name: 'Flower Photos Queue', note: 'Join the Flower Photos line if this queue is active.', imageUrl: '/images/flower-photos.webp' },
  ],
};

const FESTIVAL_NOTICES_MENU: MenuConfig = {
  id: 'festival-notices',
  icon: '!',
  color: '#5B4FCE',
  title: 'Festival Notices',
  availability: 'Quick updates for the day of the festival.',
  gallery: ['/images/Jason-and-Lauren.jpg', '/images/peony-festival-updates.jpg', '/images/woman-on-back-with-peony.webp'],
  items: [
    { emoji: 'H', name: 'Meet the Festival Hosts', note: 'Jason and Lauren are the husband-and-wife team behind the annual Peony Festival. Jason cares for the farm and peonies, and Lauren brings her love of gatherings, handmade markets, flowers, hospitality, and meaningful details.', imageUrl: '/images/Jason-and-Lauren.jpg' },
    { emoji: 'F', name: 'Their Hope for the Festival', note: 'Their hope is that visitors slow down, enjoy the beauty of spring, spend quality time with people they love, and leave feeling refreshed by the beauty of creation.', imageUrl: '/images/Jason-and-Lauren.jpg' },
    { emoji: '1', name: 'Gates Open Early', note: 'Special notice: gates open at 2 PM on Saturday, June 6 to maximize dry conditions.' },
    { emoji: '2', name: 'Clear Umbrellas', note: 'Fifty clear umbrellas can be borrowed from the ticket booth while supplies last.' },
    { emoji: '3', name: 'Double Flowers Upgrade', note: 'Festival & Flowers presale ticket holders receive an upgraded 12-stem bouquet of premium flowers.' },
    { emoji: '4', name: '$1 You-Pick Stems', note: 'End-of-season You-Pick stems are available for $1 while conditions and blooms allow.' },
    { emoji: '5', name: 'Weather Note', note: 'Festival end time may vary if weather becomes severe.' },
    { emoji: '6', name: 'Bouquet Pickup Option', note: 'Presale ticket holders may contact the farm to arrange bouquet pickup before June 12 if weather is not to their liking.' },
    { emoji: '7', name: 'Festival & Flowers Ticket', note: 'Presale ticket includes admission and a wrapped peony bouquet. The original ticket includes 6 stems; special notice upgrades June 6 presale holders to 12 stems.' },
    { emoji: '8', name: 'General Admission', note: 'Adult admission is $15 at the gate and includes access to the festival, dining lawn, live music, market, and floral installations.' },
  ],
};

const PEONY_ACTIVITIES: StaticActivity[] = [
  {
    id: 'pick-your-own',
    icon: 'P',
    color: '#7CB342',
    name: 'Pick Your Own Peonies',
    description: 'Pick peonies in the field and enjoy the farm while blooms are available.',
    time: null,
    badge: null,
    imageUrl: '/images/pick-your-own.jpeg',
    menuConfig: PICK_YOUR_OWN_MENU,
  },
  {
    id: 'live-music',
    icon: 'M',
    color: '#2196F3',
    name: 'Live Music',
    description: 'See performer details and timing for music at the festival.',
    time: null,
    badge: null,
    imageUrl: '/images/Jason-and-Lauren.jpg',
    menuConfig: LIVE_MUSIC_MENU,
  },
  {
    id: 'vendor-market',
    icon: 'V',
    color: '#00A86B',
    name: 'Vendor Market',
    description: 'Browse vendors, makers, food, and festival shopping.',
    time: null,
    badge: null,
    imageUrl: '/images/handcraft1.jpg',
    menuConfig: VENDOR_MARKET_MENU,
  },
  {
    id: 'photo-ops',
    icon: 'P',
    color: '#E91E63',
    name: 'Photo Ops',
    description: 'Find the antiques, flower basket, field, and flower photo spots.',
    time: null,
    badge: null,
    imageUrl: '/images/flower-photos.webp',
    menuConfig: PHOTO_OPS_MENU,
  },
  {
    id: 'festival-notices',
    icon: '!',
    color: '#5B4FCE',
    name: 'Festival Notices',
    description: 'Check here for event updates, weather notes, and announcements.',
    time: null,
    badge: null,
    imageUrl: '/images/peony-festival-updates.jpg',
    menuConfig: FESTIVAL_NOTICES_MENU,
  },
];

// ────────────────────────────────────────────────────────────────────────────

export default function GuestEventDetail() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const freshReset = searchParams.get('fresh') === '1';

  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<QueueWithMeta[]>([]);
  const [eces, setEces] = useState<Ece[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('just now');
  const [activeMenu, setActiveMenu] = useState<MenuConfig | null>(null);
  const [activeHomeItem, setActiveHomeItem] = useState<HomeItem | null>(null);
  const [hasEventCheckIn, setHasEventCheckIn] = useState(false);
  const [eventCheckInStatus, setEventCheckInStatus] = useState<EventCheckIn['status'] | null>(null);
  const [eventCheckInTicketType, setEventCheckInTicketType] = useState<'general' | 'flowers' | null>(null);
  const [headshotCreditStatus, setHeadshotCreditStatus] = useState<CreditStatus>('none');
  const isPeonyEvent = eventSlug === PEONY_EVENT_SLUG;

  const refresh = useCallback(async () => {
    if (!eventSlug) return;
    try {
      const ev = await getEventBySlug(eventSlug);
      const checkInConfig = getEventCheckInConfig(ev);
      setEvent((current) => hasSameShape(current, ev) ? current : ev);
      const qs = await listQueuesForEvent(ev.id);
      const didClearEventReset = clearGuestStateAfterEventReset(
        ev.id,
        qs.map((q) => q.id),
        getEventTestDataResetMarker(ev)
      );

      if (freshReset || didClearEventReset) {
        try {
          localStorage.removeItem(`qme:eventCheckIn:${ev.id}`);
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith('qme:eventCheckIn:') && key.endsWith(`:${ev.id}`)) {
              localStorage.removeItem(key);
            }
          }
          qs.forEach((q) => clearQueueTicket(q.id));
        } catch {
          /* keep loading even if browser storage is unavailable */
        }
        setSearchParams({}, { replace: true });
      }

      const storedCheckIn = localStorage.getItem(`qme:eventCheckIn:${ev.id}`);
      let checkInTicketType: 'general' | 'flowers' | null = null;
      let nextEventCheckInStatus: EventCheckIn['status'] | null = null;
      let nextHasEventCheckIn = false;
      let nextHeadshotCreditStatus: CreditStatus = 'none';
      if (storedCheckIn) {
        try {
          const saved = JSON.parse(storedCheckIn) as { id?: string };
          if (saved.id) {
            const row = await getEventCheckIn(saved.id, ev.id);
            nextEventCheckInStatus = row.status;
            if (!checkInConfig.requireCompletedForParticipation || row.status === 'completed') {
              checkInTicketType = row.ticket_type;
              nextHasEventCheckIn = true;
              const credit = await getGuestCreditForCheckIn(row.id, 'professional_headshot', ev.id);
              nextHeadshotCreditStatus = credit
                ? credit.quantity > credit.used_quantity ? 'available' : 'used'
                : 'none';
            }
          }
        } catch {
          nextEventCheckInStatus = null;
          nextHasEventCheckIn = false;
          nextHeadshotCreditStatus = 'none';
        }
      }
      setEventCheckInStatus((current) => current === nextEventCheckInStatus ? current : nextEventCheckInStatus);
      setEventCheckInTicketType((current) => current === checkInTicketType ? current : checkInTicketType);
      setHasEventCheckIn((current) => current === nextHasEventCheckIn ? current : nextHasEventCheckIn);
      setHeadshotCreditStatus((current) =>
        current === nextHeadshotCreditStatus ? current : nextHeadshotCreditStatus
      );
      const enriched: QueueWithMeta[] = await Promise.all(
        qs
          .filter((q) => q.status === 'active')
          .map(async (q) => {
            const storedTicketId = getStoredQueueTicket(q.id);
            let ticket = getStoredQueueTicketNumber(q.id);
            let ticketStage: Ticket['stage'];
            let tickets: Ticket[] = [];
            let didLoadTickets = false;
            try {
              tickets = await listQueuePilotTickets(q.id);
              didLoadTickets = true;
            } catch {
              tickets = [];
            }
            if (storedTicketId) {
              try {
                const ticketRow = await getQueueTicket(Number(storedTicketId), q.id, ev.id);
                if (['cancelled', 'left'].includes(ticketRow.stage ?? 'waiting') || ticketRow.status === 'left') {
                  clearQueueTicket(q.id);
                  ticket = '';
                } else {
                  ticket = String(ticketRow.ticket_number ?? ticketRow.id);
                  ticketStage = ticketRow.stage;
                  localStorage.setItem(`qme:ticket:${q.id}`, String(ticketRow.id));
                  localStorage.setItem(`qme:ticketNum:${q.id}`, String(ticketRow.ticket_number ?? ticketRow.id));
                }
              } catch {
                try {
                  const restored = await restoreTicketForQueue(Number(storedTicketId), q.id, ev.id);
                  const ticketRow = await getQueueTicket(restored.id, q.id, ev.id);
                  if (['cancelled', 'left'].includes(ticketRow.stage ?? 'waiting') || ticketRow.status === 'left') {
                    clearQueueTicket(q.id);
                    ticket = '';
                  } else {
                    ticket = String(restored.ticketNumber);
                    ticketStage = ticketRow.stage;
                    localStorage.setItem(`qme:ticket:${q.id}`, String(restored.id));
                    localStorage.setItem(`qme:ticketNum:${q.id}`, String(restored.ticketNumber));
                  }
                } catch {
                  clearQueueTicket(q.id);
                  ticket = '';
                }
              }
            }
            let ns = q.now_serving;
            try { ns = await getNowServing(q.id); } catch { /* */ }
            let waitingCount = 0;
            try {
              waitingCount = await getActiveTicketCountForQueue(q.id);
            } catch {
              if (didLoadTickets) {
                waitingCount = tickets.filter((row) => {
                  const stage = row.stage ?? 'waiting';
                  return !['completed', 'cancelled', 'left'].includes(stage) && !['left', 'served'].includes(row.status);
                }).length;
              } else {
                waitingCount = Math.max(0, Number(ticket || 0) - ns + 1);
              }
            }
            return { ...q, _myTicket: ticket || undefined, _myStage: ticketStage, _nowServing: ns, _waitingCount: waitingCount };
          })
      );
      const nextQueues = enriched.filter((q) => {
        if (q.slug === 'wrapped-bouquets') return checkInTicketType === 'flowers';
        return true;
      });
      setQueues((current) => hasSameShape(current, nextQueues) ? current : nextQueues);

      const eventEces = eventSlug === PEONY_EVENT_SLUG ? [] : await listActiveEcesForEvent(ev.id);
      setEces((current) => hasSameShape(current, eventEces) ? current : eventEces);

      setLastUpdated('just now');
    } catch (e) {
      console.error('Failed to load event', e);
    } finally {
      setLoading(false);
    }
  }, [eventSlug, freshReset, setSearchParams]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Event not found.</p>
        <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
          <button className="actionBtn" style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
            onClick={() => navigate('/demo')}>← Back</button>
        </div>
      </div>
    );
  }

  const visibleStaticActivities = isPeonyEvent ? PEONY_ACTIVITIES : [];
  const checkInConfig = getEventCheckInConfig(event);
  const requiresCompletedCheckIn = checkInConfig.requireCompletedForParticipation;
  const hasSubmittedEventCheckIn = Boolean(eventCheckInStatus);
  const isWaitingForHostCheckIn = hasSubmittedEventCheckIn && !hasEventCheckIn;
  const homeEligibleEces = checkInConfig.enabled
    ? eces.filter((ece) => ece.type !== 'check_in')
    : eces;
  const visibleEces = homeEligibleEces.filter(isEceHomeVisible);
  const eceSections = getSectionedEces(visibleEces);
  const linkedEceQueueIds = new Set(homeEligibleEces.map((ece) => ece.queue_id).filter(Boolean));
  const visibleQueues = queues.filter((q) => !linkedEceQueueIds.has(q.id));
  const checkInCardCount = checkInConfig.enabled ? 1 : 0;
  const sessionCount =
    checkInCardCount +
    visibleQueues.length +
    visibleStaticActivities.filter(a => a.id !== 'live-updates').length +
    visibleEces.length;
  const isHeadshotQueue = (slug?: string | null) => slug === 'headshot-photo-station';

  return (
    <>
      <div className="card card-scrollable ed-card">

        {/* ── Event Header ── */}
        <div className="ed-header">
          <div className="ed-header-top">
            <div className="ed-header-left">
              <img
                src={event.slug === 'sotc-test-check-in' ? '/images/sotc-logo.png' : event.image_url || '/images/icorps.png'}
                alt={event.name}
                className="ed-logo"
              />
              <div className="ed-header-info">
                <div className="ed-event-name">{event.name}</div>
                {event.location && (
                  <div className="ed-location">📍 {event.location}</div>
                )}
              </div>
            </div>
            <div className="ed-live-badge">● Live</div>
          </div>

          {/* Stats row */}
          <div className="ed-stats">
            <div className="ed-stat">
              <span className="ed-stat-icon">🎙</span>
              <span className="ed-stat-val">{sessionCount}</span>
              <span className="ed-stat-label">Sessions</span>
            </div>
            {event.start_time && (
              <div className="ed-stat">
                <span className="ed-stat-icon">🕖</span>
                <span className="ed-stat-val">{formatTime(event.start_time)}</span>
                <span className="ed-stat-label">Starts</span>
              </div>
            )}
            <div className="ed-stat ed-stat-right">
              <span className="ed-stat-icon">⏱</span>
              <span className="ed-stat-label">Updated {lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* ── Guest View Label ── */}
        <div className="ed-section-header">
          <span className="ed-section-title">GUEST VIEW</span>
          <span className="ed-section-sub">See what's happening across the event.</span>
        </div>

        {/* ── Activity list ── */}
        <div className="ed-activity-list">

          {/* Arrival check-in */}
          {checkInConfig.enabled && !hasEventCheckIn && (
          <div className="ed-activity-card ed-card-clickable">
            <div className="ed-check-icon" aria-hidden="true">
              <span style={{ fontSize: '1.1rem' }}>✓</span>
            </div>
            <div className="ed-activity-body">
              <div className="ed-activity-name-row">
                <span className="ed-activity-name">{isPeonyEvent ? 'Check In at Mobile Bar' : 'Event Check-In'}</span>
                <span className="ed-badge ed-badge-active">{isWaitingForHostCheckIn ? 'WAITING FOR STAFF' : 'START HERE'}</span>
              </div>
              <div className="ed-activity-desc">
                {isWaitingForHostCheckIn
                  ? 'Your name has been submitted. Please wait here until staff confirms your event check-in.'
                  : !isPeonyEvent
                  ? 'Enter your name when you arrive so the event team can confirm your check-in.'
                  : eventCheckInTicketType === 'flowers'
                  ? 'You are checked in with flowers access. Use the Bouquet Bar option below when ready.'
                  : 'Enter your name when you arrive so the team can prepare your admission and bouquet access.'}
              </div>
            </div>
            <div className="ed-activity-right">
              <Link to={`/events/${eventSlug}/check-in`} className="ed-action-btn">
                {isWaitingForHostCheckIn ? 'Check-In Status' : 'Check In'}
              </Link>
            </div>
          </div>
          )}

          {/* Live joinable queues */}
          {visibleQueues.map((q) => {
            const isHeadshot = isHeadshotQueue(q.slug);
            const headshotHasCredit = headshotCreditStatus === 'available' || headshotCreditStatus === 'used';
            const hasTicket = Boolean(q._myTicket) && (!isHeadshot || headshotHasCredit);
            const isCompleted = hasTicket && q._myStage === 'completed';
            const participationLocked = requiresCompletedCheckIn && !hasEventCheckIn && !hasTicket;
            const creditLocked = isHeadshot && headshotCreditStatus === 'none' && !hasTicket;
            const creditUsed = isHeadshot && headshotCreditStatus === 'used' && !hasTicket;
            const joinPaused = (q.join_status ?? 'open') !== 'open' && !hasTicket;
            const canJoin = !hasTicket && !isCompleted && !participationLocked && !creditLocked && !creditUsed && !joinPaused;
            const statusLine = queueCardStatusLine({
              hasTicket,
              stage: q._myStage,
              creditUsed,
              participationLocked,
              creditLocked,
              joinPaused,
            });
            const cardStateClass = isCompleted || creditUsed
              ? 'ed-card-completed'
              : hasTicket
              ? 'ed-card-joined'
              : '';
            return (
              <div key={q.id} className={`ed-activity-card ${cardStateClass}`}>
                <div className="ed-activity-icon-wrap" style={{ background: '#EDE9FF' }}>
                  <img
                    src={q.slug === 'scan-code-adventure'
                      ? '/images/dog-through-hoop.png'
                      : q.slug === 'headshot-photo-station'
                      ? '/images/headshot-photo-station.png'
                      : q.image_url || '/images/zippy.png'}
                    alt={q.slug === 'wrapped-bouquets' ? 'Bouquet Bar' : q.name}
                    className="ed-activity-icon-img"
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                <div className="ed-activity-body">
                  <div className="ed-activity-name-row">
                    <span className="ed-activity-name">{q.slug === 'wrapped-bouquets' ? 'Bouquet Bar' : q.name}</span>
                  </div>
                  {!isCompleted && !creditUsed && (
                    <div className="ed-activity-desc">
                      {participationLocked
                        ? 'Complete Event Check-In above before joining this experience.'
                        : creditLocked
                        ? 'A headshot photo credit is required to join this station.'
                        : joinPaused
                        ? 'Joining is paused while the event team prepares this station.'
                        : q.slug === 'wrapped-bouquets'
                        ? 'Special flowers ticket access for wrapped bouquets.'
                        : q.description}
                    </div>
                  )}
                  {event.start_time && (
                    <div className="ed-activity-meta">
                      <span>Starts {formatTime(event.start_time)}</span>
                    </div>
                  )}
                  <div className="ed-ticket-note">
                    {statusLine}
                  </div>
                </div>
                <div className="ed-activity-right">
                  {canJoin && (
                    <div className="ed-serving-badge">
                      <div className="ed-serving-label">Waiting</div>
                      <div className="ed-serving-num">{q._waitingCount ?? 0}</div>
                    </div>
                  )}
                  {hasTicket ? (
                    <Link to={`/events/${eventSlug}/q/${q.slug}/ticket`} className="ed-action-btn ed-action-btn-secondary">
                      {isCompleted ? 'Done' : 'View'}
                    </Link>
                  ) : canJoin ? (
                    <Link to={`/events/${eventSlug}/q/${q.slug}`} className="ed-action-btn">
                      Join
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Dynamic event eCes from DB */}
          {eceSections.map((section) => (
            <div key={section.key} className="ed-home-section">
              {section.title && (
                <div className="ed-home-section-title">{section.title}</div>
              )}
              {section.eces.map((exp) => {
            const linkedQueue = exp.queue_id ? queues.find((q) => q.id === exp.queue_id) : null;
            const isHeadshot = isHeadshotQueue(linkedQueue?.slug);
            const headshotHasCredit = headshotCreditStatus === 'available' || headshotCreditStatus === 'used';
            const hasTicket = Boolean(linkedQueue?._myTicket) && (!isHeadshot || headshotHasCredit);
            const isCompleted = hasTicket && linkedQueue?._myStage === 'completed';
            const participationLocked = Boolean(linkedQueue && requiresCompletedCheckIn && !hasEventCheckIn && !hasTicket);
            const creditLocked = Boolean(linkedQueue && isHeadshot && headshotCreditStatus === 'none' && !hasTicket);
            const creditUsed = Boolean(linkedQueue && isHeadshot && headshotCreditStatus === 'used' && !hasTicket);
            const joinPaused = Boolean(linkedQueue && (linkedQueue.join_status ?? 'open') !== 'open' && !hasTicket);
            const canJoin = Boolean(linkedQueue && !hasTicket && !isCompleted && !participationLocked && !creditLocked && !creditUsed && !joinPaused);
            const homeBadge = getEceHomeBadge(exp);
            const homeActionLabel = getEceHomeActionLabel(exp);
            const homeUrl = getEceHomeUrl(exp);
            const hideHomeHeader = shouldHideEceHomeHeader(exp);
            const homeIconVariant = getEceHomeIconVariant(exp);
            const homeItemsLayout = getEceHomeItemsLayout(exp);
            const homeItems = getEceHomeItems(exp);
            const statusLine = linkedQueue ? queueCardStatusLine({
              hasTicket,
              stage: linkedQueue._myStage,
              creditUsed,
              participationLocked,
              creditLocked,
              joinPaused,
            }) : '';
            const isGroupOrder = isGroupOrderEce(exp);
            const groupOrderStatusLine = isGroupOrder
              ? hasEventCheckIn ? 'Ready to order' : isWaitingForHostCheckIn ? 'Waiting for host check-in' : 'Check in first'
              : '';
            const actionHref = isGroupOrder
              ? `/events/${eventSlug}/group-order`
              : exp.type === 'check_in'
              ? `/events/${eventSlug}/check-in`
              : linkedQueue
              ? canJoin ? `/events/${eventSlug}/q/${linkedQueue.slug}` : ''
              : '';
            const viewHref = linkedQueue
              ? `/events/${eventSlug}/q/${linkedQueue.slug}/ticket`
              : '';
            const canAct = Boolean(actionHref || viewHref || homeUrl);
            const cardStateClass = isCompleted || creditUsed
              ? 'ed-card-completed'
              : hasTicket
              ? 'ed-card-joined'
              : '';
            const homeItemImageCount = homeItems.filter((item) => item.imageUrl).length;
            const hasMediaRows = homeItemsLayout === 'media_rows' || homeItemImageCount > 1;
            const cardClass = `ed-activity-card ed-activity-card-info ${hasMediaRows ? 'ed-activity-card-media-rows' : ''} ${canAct ? 'ed-card-clickable' : ''} ${cardStateClass}`;
            const handleEceOpen = () => {
              if (hasTicket && viewHref) {
                navigate(viewHref);
              } else if (actionHref) {
                navigate(actionHref);
              } else if (homeUrl) {
                window.open(homeUrl, '_blank', 'noopener,noreferrer');
              }
            };
            const actionText = hasTicket
              ? isCompleted ? 'Done' : 'View'
              : participationLocked
              ? ''
              : creditLocked || creditUsed || joinPaused
              ? ''
              : isGroupOrder
              ? homeActionLabel || 'Order'
              : linkedQueue
              ? homeActionLabel || 'Join'
              : homeUrl
              ? homeActionLabel || 'Open'
              : exp.type === 'check_in'
              ? homeActionLabel || 'Check In'
              : '';

            return (
            <div
              key={exp.id}
              className={cardClass}
              onClick={canAct ? handleEceOpen : undefined}
              role={canAct ? 'button' : undefined}
              tabIndex={canAct ? 0 : undefined}
              onKeyDown={canAct ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleEceOpen(); } : undefined}
            >
              {!hasMediaRows && (
              <div className={`ed-activity-icon-wrap ${homeIconVariant === 'wide' ? 'ed-activity-icon-wrap-wide' : ''}`} style={{ background: '#E8F5E9' }}>
                {exp.image_url || exp.slug === 'scan-code-adventure' || exp.slug === 'headshot-photo-station'
                  ? <img src={exp.slug === 'scan-code-adventure' ? '/images/dog-through-hoop.png' : exp.slug === 'headshot-photo-station' ? '/images/headshot-photo-station.png' : exp.image_url} alt={exp.name} className="ed-activity-icon-img" style={{ borderRadius: '8px' }} />
                  : <span style={{ fontSize: '1.1rem' }}>âœ¨</span>}
              </div>
              )}
              <div className="ed-activity-body">
                {!hideHomeHeader && (
                  <div className="ed-activity-name-row">
                    <span className="ed-activity-name">{exp.name}</span>
                    {homeBadge && (
                      <span className="ed-badge ed-badge-featured">{homeBadge}</span>
                    )}
                  </div>
                )}
                {hideHomeHeader || isCompleted ? null : participationLocked ? (
                  <div className="ed-activity-desc">Complete Event Check-In above before joining this experience.</div>
                ) : creditLocked ? (
                  <div className="ed-activity-desc">A headshot photo credit is required to join this station.</div>
                ) : creditUsed ? null : joinPaused ? (
                  <div className="ed-activity-desc">Joining is paused while the event team prepares this station.</div>
                ) : exp.description && (
                  <div className="ed-activity-desc">{exp.description}</div>
                )}
                {linkedQueue && event.start_time && (
                  <div className="ed-activity-meta">
                    <span>Starts {formatTime(event.start_time)}</span>
                  </div>
                )}
                {(linkedQueue || groupOrderStatusLine) && (
                  <div className="ed-ticket-note">
                    {linkedQueue ? statusLine : groupOrderStatusLine}
                  </div>
                )}
                {homeItems.length > 0 && (
                  <div className="ed-home-items">
                    {homeItems.map((item, index) => {
                      const opensDetails = item.details.length > 0 && item.detailsMode === 'modal';
                      const opensEmbed = Boolean(item.url) && item.detailsMode === 'embed';
                      const opensModal = opensDetails || opensEmbed;
                      const openDetail = (e: MouseEvent | KeyboardEvent) => {
                        if (!opensModal) return;
                        e.stopPropagation();
                        setActiveHomeItem(item);
                      };

                      return (
                      <div
                        className={`ed-home-item ${opensModal ? 'ed-home-item-clickable' : ''}`}
                        key={`${item.title}-${index}`}
                        role={opensModal ? 'button' : undefined}
                        tabIndex={opensModal ? 0 : undefined}
                        onClick={opensModal ? openDetail : undefined}
                        onKeyDown={opensModal ? (e) => { if (e.key === 'Enter' || e.key === ' ') openDetail(e); } : undefined}
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title || item.meta || 'Sponsor'}
                            className={`ed-home-item-logo ${item.imageVariant === 'wide' ? 'ed-home-item-logo-wide' : ''}`}
                          />
                        )}
                        <span className="ed-home-item-copy">
                          {item.title && item.url && !opensEmbed ? (
                            <a
                              href={item.url}
                              className="ed-home-item-title ed-home-item-link"
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.title}
                            </a>
                          ) : item.title && (
                            <span className={`ed-home-item-title ${opensModal ? 'ed-home-item-link' : ''}`}>
                              {item.title}
                            </span>
                          )}
                          {item.meta && <span className="ed-home-item-meta">{item.meta}</span>}
                          {item.note && <span className="ed-home-item-note">{item.note}</span>}
                          {item.details.length > 0 && !opensDetails && (
                            <span className="ed-home-item-details">
                              {item.details.map((detail, detailIndex) => (
                                <span className="ed-home-item-detail-row" key={`${detail.label}-${detailIndex}`}>
                                  <span className="ed-home-item-detail-label">{detail.label}</span>
                                  {detail.value && <span className="ed-home-item-detail-value">{detail.value}</span>}
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="ed-activity-right">
                {canJoin && (
                  <div className="ed-serving-badge">
                    <div className="ed-serving-label">Waiting</div>
                    <div className="ed-serving-num">{linkedQueue?._waitingCount ?? 0}</div>
                  </div>
                )}
                {actionText && homeUrl && !actionHref && !viewHref ? (
                  <button
                    type="button"
                    className="ed-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEceOpen();
                    }}
                  >
                    {actionText}
                  </button>
                ) : actionText && (
                  <Link
                    to={hasTicket && viewHref ? viewHref : actionHref}
                    className={`ed-action-btn ${hasTicket ? 'ed-action-btn-secondary' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actionText}
                  </Link>
                )}
              </div>
            </div>
            );
              })}
            </div>
          ))}

          {/* Static informational activities */}
          {visibleStaticActivities.map((act) => {
            const isClickable = Boolean(act.menuConfig);
            return (
              <div
                key={act.id}
                className={`ed-activity-card ed-activity-card-info ${isClickable ? 'ed-card-clickable' : ''}`}
                onClick={isClickable ? () => setActiveMenu(act.menuConfig!) : undefined}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') setActiveMenu(act.menuConfig!); } : undefined}
              >
                <div
                  className="ed-activity-icon-wrap"
                  style={{ background: act.color + '22' }}
                >
                  {act.imageUrl
                    ? <img src={act.imageUrl} alt={act.name} className="ed-activity-icon-img" style={{ borderRadius: '8px' }} />
                    : act.icon === 'qMe'
                    ? <span style={{ fontSize: '0.65rem', fontWeight: 800, color: act.color }}>qMe</span>
                    : <span style={{ fontSize: '1.1rem' }}>{act.icon}</span>}
                </div>
                <div className="ed-activity-body">
                  <div className="ed-activity-name-row">
                    <span className="ed-activity-name">{act.name}</span>
                    {act.badge && (
                      <span className="ed-badge ed-badge-featured">{act.badge}</span>
                    )}
                  </div>
                  {act.description && (
                    <div className="ed-activity-desc">{act.description}</div>
                  )}
                  {act.time && (
                    <div className="ed-activity-time" style={{ color: act.color }}>
                      {act.time}
                    </div>
                  )}
                </div>
                <div className="ed-activity-right ed-activity-chevron">
                  <span />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu bottom sheet — rendered outside card so it overlays everything */}
      <MenuModal config={activeMenu} onClose={() => setActiveMenu(null)} />
      {activeHomeItem && (
        <div className="ed-detail-overlay" role="dialog" aria-modal="true">
          <div className="ed-detail-panel">
            <button type="button" className="ed-detail-close" onClick={() => setActiveHomeItem(null)}>
              Close
            </button>
            <h2>{activeHomeItem.title}</h2>
            {activeHomeItem.note && <p>{activeHomeItem.note}</p>}
            {activeHomeItem.detailsMode === 'embed' && activeHomeItem.url ? (
              <iframe
                className="ed-detail-frame"
                src={activeHomeItem.url}
                title={activeHomeItem.title}
              />
            ) : (
              <div className="ed-detail-list">
                {activeHomeItem.details.map((detail, index) => (
                  <div className="ed-detail-row" key={`${detail.label}-${index}`}>
                    {detail.color && (
                      <span className="ed-detail-dot" style={{ background: detail.color }} />
                    )}
                    <span className="ed-detail-text">
                      <span className="ed-detail-label">{detail.label}</span>
                      {detail.value && <span className="ed-detail-value">{detail.value}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
