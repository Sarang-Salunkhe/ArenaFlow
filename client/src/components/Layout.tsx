import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AssistantProvider, useAssistant } from '../context/AssistantContext';
import { FloatingAssistant } from './ui/FloatingAssistant';
import { useAuth } from '../hooks/useAuth';
import { AnnouncementsBar } from './AnnouncementsBar';
import { LiveMatchStatusBar } from './LiveMatchStatusBar';

function LayoutContent() {
  const { selectedZoneId, stadiumState } = useAssistant();
  const { user } = useAuth();
  const role = user?.role || null;

  return (
    <div className="flex min-h-[100svh] w-full flex-col bg-arena-navy text-slate-100">
      <AnnouncementsBar />
      <LiveMatchStatusBar />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
      {role && (
        <FloatingAssistant
          role={role}
          selectedZoneId={selectedZoneId}
          stadiumState={stadiumState}
        />
      )}
    </div>
  );
}

export function Layout() {
  return (
    <AssistantProvider>
      <LayoutContent />
    </AssistantProvider>
  );
}
