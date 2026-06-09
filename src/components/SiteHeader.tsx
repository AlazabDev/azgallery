import logo from '../assets/logo-alazab-animated.gif';

interface Props {
  onHome: () => void;
  onAdmin: () => void;
}

export function SiteHeader({ onHome, onAdmin }: Props) {
  return (
    <header className="site-header">
      <button className="site-header__brand" type="button" onClick={onHome} aria-label="العودة إلى المشروعات">
        <img src={logo} alt="العزب" />
        <span>
          <strong>AzGallery</strong>
          <small>معرض مراجعة مشروعات العزب</small>
        </span>
      </button>
      <button className="site-header__admin" type="button" onClick={onAdmin}>لوحة الإدارة</button>
    </header>
  );
}
