import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AssistantProvider, useAssistant } from '../context/AssistantContext';
import { FloatingAssistant } from './ui/FloatingAssistant';

function LayoutContent() {
  const location = useLocation();
  const { selectedZoneId, stadiumState } = useAssistant();

  let role: 'OPERATIONS' | 'FAN' | 'VOLUNTEER' | null = null;
  if (location.pathname.startsWith('/operations')) {
    role = 'OPERATIONS';
  } else if (location.pathname.startsWith('/fan')) {
    role = 'FAN';
  } else if (location.pathname.startsWith('/volunteer')) {
    role = 'VOLUNTEER';
  }

  return (
    <div className="flex min-h-[100svh] w-full flex-col bg-arena-navy text-slate-100">
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
