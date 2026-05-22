import TopBar from './TopBar';

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <TopBar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
