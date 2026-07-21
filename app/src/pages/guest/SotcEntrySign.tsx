import { QRCodeSVG } from 'qrcode.react';
import Header from '../../components/Header';
import '../../styles/shared.css';
import '../../styles/guest.css';

const SOTC_EVENT_URL = 'https://www.qme.lol/events/sotc-rockhall';

export default function SotcEntrySign() {
  return (
    <main className="sotc-entry-sign-page">
      <section className="card sotc-entry-sign-card" aria-labelledby="sotc-entry-sign-title">
        <Header
          logoSrc="/images/sotc-logo.png"
          titleLine1="WELCOME"
          titleLine2="SOTC"
        />

        <div className="sotc-entry-sign-content">
          <p className="sotc-entry-eyebrow">SOTC Collegiate Career & Community Leader Mixer</p>
          <h1 id="sotc-entry-sign-title">Scan to enter qMe</h1>
          <p className="sotc-entry-lede">
            Use qMe to self check in, see tonight's schedule, and join the Headshot Photographer digital queue.
          </p>

          <div className="sotc-entry-qr-wrap" aria-label="QR code for SOTC qMe event page">
            <QRCodeSVG value={SOTC_EVENT_URL} size={260} level="H" includeMargin />
          </div>

          <div className="sotc-entry-url">{SOTC_EVENT_URL}</div>

          <div className="sotc-entry-steps">
            <div>
              <strong>1. Find your registration</strong>
              <span>Self check in if you pre-registered.</span>
            </div>
            <div>
              <strong>2. Pick up your name tag</strong>
              <span>Stop at the registration desk after checking in.</span>
            </div>
            <div>
              <strong>3. Enjoy the event</strong>
              <span>Use qMe for details, resources, and the Headshot queue.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
