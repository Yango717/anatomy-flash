import { useLocation, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import { TABS } from '../../utils/constants';

function getActiveTab(pathname) {
  if (pathname === '/') return 'home';
  if (pathname === '/exam') return 'exam';
  if (pathname === '/practice' || pathname.startsWith('/practice/')) return 'exam';
  if (pathname === '/review') return 'review';
  if (pathname === '/me') return 'me';
  if (pathname.startsWith('/modules') || pathname.startsWith('/sections') ||
      pathname.startsWith('/learn') || pathname.startsWith('/quiz') ||
      pathname.startsWith('/review/') || pathname.startsWith('/test') ||
      pathname.startsWith('/finalexam')) return 'systems';
  return 'home';
}

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(location.pathname);

  return (
    <header className="topbar">
      <div className="topbar__logo">解</div>
      <SearchBar />
      <nav className="topbar__nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`topbar__tab ${activeTab === tab.key ? 'topbar__tab--active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
