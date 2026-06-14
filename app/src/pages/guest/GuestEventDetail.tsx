/**
 * Guest: Event detail page — live queues + informational activity cards.
 * Redesigned for I-Pitch demo: Live badge, stats bar, clickable menus.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getEventBySlug } from '../../lib/eventService';
import { listQueuesForEvent, getNowServing } from '../../lib/queueService';
import { listExperiencesForEvent } from '../../lib/experienceService';
import { getEventCheckIn } from '../../lib/checkInService';
import { formatTime } from '../../lib/utils';
import { getStoredQueueTicket, clearQueueTicket } from '../../hooks/useQueueTicket';
import MenuModal, { type MenuConfig } from '../../components/MenuModal';
import type { QEvent, Queue, Experience } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';
import '../../styles/eventDetail.css';

interface QueueWithMeta extends Queue {
  _myTicket?: string;
  _nowServing?: number;
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

// Demo toggles: keep these sections available in code without showing them.
const SHOW_DB_EXPERIENCES = false;
const SHOW_STATIC_ACTIVITIES = true;

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
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('just now');
  const [activeMenu, setActiveMenu] = useState<MenuConfig | null>(null);
  const [hasEventCheckIn, setHasEventCheckIn] = useState(false);
  const [eventCheckInTicketType, setEventCheckInTicketType] = useState<'general' | 'flowers' | null>(null);

  const refresh = useCallback(async () => {
    if (!eventSlug) return;
    try {
      const ev = await getEventBySlug(eventSlug);
      setEvent(ev);
      const qs = await listQueuesForEvent(ev.id);

      if (freshReset) {
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
      setHasEventCheckIn(Boolean(storedCheckIn));
      setEventCheckInTicketType(null);
      if (storedCheckIn) {
        try {
          const saved = JSON.parse(storedCheckIn) as { id?: string };
          if (saved.id) {
            const row = await getEventCheckIn(saved.id);
            checkInTicketType = row.ticket_type;
            setEventCheckInTicketType(checkInTicketType);
          }
        } catch {
          /* keep the local checked-in state even if the row cannot be read */
        }
      }
      const enriched: QueueWithMeta[] = await Promise.all(
        qs
          .filter((q) => q.status === 'active')
          .map(async (q) => {
            const ticket = getStoredQueueTicket(q.id);
            let ns = q.now_serving;
            try { ns = await getNowServing(q.id); } catch { /* */ }
            return { ...q, _myTicket: ticket || undefined, _nowServing: ns };
          })
      );
      setQueues(enriched.filter((q) => q.slug !== 'wrapped-bouquets' || checkInTicketType === 'flowers'));

      const exps = SHOW_DB_EXPERIENCES ? await listExperiencesForEvent(ev.id) : [];
      setExperiences(exps);

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

  const visibleStaticActivities = SHOW_STATIC_ACTIVITIES ? PEONY_ACTIVITIES : [];
  const sessionCount = queues.length + visibleStaticActivities.filter(a => a.id !== 'live-updates').length + experiences.length;

  return (
    <>
      <div className="card card-scrollable ed-card">

        {/* ── Event Header ── */}
        <div className="ed-header">
          <div className="ed-header-top">
            <div className="ed-header-left">
              <img
                src={event.image_url || '/images/icorps.png'}
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
          <div className="ed-activity-card ed-card-clickable">
            <div className="ed-activity-icon-wrap" style={{ background: '#E8F5E9' }}>
              <span style={{ fontSize: '1.1rem' }}>✓</span>
            </div>
            <div className="ed-activity-body">
              <div className="ed-activity-name-row">
                <span className="ed-activity-name">Check In at Mobile Bar</span>
                <span className="ed-badge ed-badge-active">{hasEventCheckIn ? 'DONE' : 'START HERE'}</span>
              </div>
              <div className="ed-activity-desc">
                {eventCheckInTicketType === 'flowers'
                  ? 'You are checked in with flowers access. Use the Bouquet Bar option below when ready.'
                  : hasEventCheckIn
                  ? 'You are checked in. Please stay near the mobile bar if the team needs you.'
                  : 'Enter your name when you arrive so the team can prepare your admission and bouquet access.'}
              </div>
            </div>
            <div className="ed-activity-right">
              {hasEventCheckIn ? (
                <Link to={`/events/${eventSlug}`} className="ed-action-btn ed-action-btn-secondary">
                  Checked In
                </Link>
              ) : (
                <Link to={`/events/${eventSlug}/check-in`} className="ed-action-btn">
                  Check In &gt;
                </Link>
              )}
            </div>
          </div>

          {/* Live joinable queues */}
          {queues.map((q) => {
            const hasTicket = Boolean(q._myTicket);
            return (
              <div key={q.id} className={`ed-activity-card ${hasTicket ? 'ed-card-joined' : ''}`}>
                <div className="ed-activity-icon-wrap" style={{ background: '#EDE9FF' }}>
                  <img
                    src={q.image_url || '/images/zippy.png'}
                    alt={q.slug === 'wrapped-bouquets' ? 'Bouquet Bar' : q.name}
                    className="ed-activity-icon-img"
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                <div className="ed-activity-body">
                  <div className="ed-activity-name-row">
                    <span className="ed-activity-name">{q.slug === 'wrapped-bouquets' ? 'Bouquet Bar' : q.name}</span>
                    <span className="ed-badge ed-badge-active">ACTIVE</span>
                  </div>
                  <div className="ed-activity-desc">
                    {q.slug === 'wrapped-bouquets'
                      ? 'Special flowers ticket access for wrapped bouquets.'
                      : q.description}
                  </div>
                  {event.start_time && (
                    <div className="ed-activity-meta">
                      <span>Starts {formatTime(event.start_time)}</span>
                    </div>
                  )}
                  {hasTicket && (
                    <div className="ed-ticket-note">🎫 You're in line — #{q._myTicket}</div>
                  )}
                </div>
                <div className="ed-activity-right">
                  <div className="ed-serving-badge">
                    <div className="ed-serving-label">Now Serving</div>
                    <div className="ed-serving-num">{q._nowServing ?? q.now_serving}</div>
                  </div>
                  {hasTicket ? (
                    <Link to={`/events/${eventSlug}/q/${q.slug}/ticket`} className="ed-action-btn ed-action-btn-secondary">
                      View ›
                    </Link>
                  ) : (
                    <Link to={`/events/${eventSlug}/q/${q.slug}`} className="ed-action-btn">
                      Join ›
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {/* Dynamic experiences from DB */}
          {experiences.map((exp) => (
            <div key={exp.id} className="ed-activity-card ed-activity-card-info">
              <div className="ed-activity-icon-wrap" style={{ background: '#E8F5E9' }}>
                {exp.image_url
                  ? <img src={exp.image_url} alt={exp.name} className="ed-activity-icon-img" style={{ borderRadius: '8px' }} />
                  : <span style={{ fontSize: '1.1rem' }}>✨</span>}
              </div>
              <div className="ed-activity-body">
                <div className="ed-activity-name-row">
                  <span className="ed-activity-name">{exp.name}</span>
                </div>
                {exp.description && (
                  <div className="ed-activity-desc">{exp.description}</div>
                )}
              </div>
              <div className="ed-activity-right ed-activity-chevron">
                <span style={{ color: '#e0e0e0' }}>›</span>
              </div>
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
                  {isClickable ? '>' : <span style={{ color: '#e0e0e0' }}>&gt;</span>}
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Menu bottom sheet — rendered outside card so it overlays everything */}
      <MenuModal config={activeMenu} onClose={() => setActiveMenu(null)} />
    </>
  );
}
