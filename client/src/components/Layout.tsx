import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex min-h-[100svh] w-full flex-col bg-arena-navy text-slate-100">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
