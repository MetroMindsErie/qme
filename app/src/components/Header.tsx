import Menu from './Menu';

interface HeaderProps {
  logoSrc?: string;
  titleLine1?: string;
  titleLine2?: string;
  menuChildren?: React.ReactNode;
}

export default function Header({
  logoSrc = '/images/qmeFirstLogo.jpg',
  titleLine1 = '',
  titleLine2 = '',
  menuChildren,
}: HeaderProps) {
  return (
    <div className="hdr">
      {/* Left: logo */}
      <div className="hdrLogoBox">
        <img
          id="hdrLogo"
          src={logoSrc}
          alt="Logo"
          className="hdrLogoImg"
        />
      </div>

      {/* Center: two-line title */}
      <div className="hdrTitle" aria-label="Now Serving">
        <span className="titleLine">{titleLine1}</span>
        <span className="titleLine">{titleLine2}</span>
      </div>

      {/* Right: hamburger */}
      <Menu>{menuChildren}</Menu>
    </div>
  );
}
