import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useMediaQuery, LG_UP } from '../../hooks/useMediaQuery';
import { cn } from '../../utils/cn';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const lgUp = useMediaQuery(LG_UP);
  // Never persisted (I-15) — every Layout mount starts closed.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    // No-op once `lgUp` flips: TopBar (and the hamburger) unmount in the same
    // render that hides the drawer, so there is nothing left to refocus.
    hamburgerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (lgUp) closeDrawer();
  }, [lgUp, closeDrawer]);

  // Moves focus into the drawer the moment it opens, so a keyboard/screen-
  // reader user isn't left tabbing through the page underneath the overlay.
  useEffect(() => {
    if (drawerOpen) closeButtonRef.current?.focus();
  }, [drawerOpen]);

  // Same document.body.style.overflow lock Modal.tsx uses, kept alongside the
  // `<main>` overflow toggle below as a second line of defence (harmless: the
  // shell itself never scrolls the body).
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, closeDrawer]);

  return (
    <div className="gd-shell flex h-screen flex-col bg-canvas lg:flex-row">
      {lgUp ? (
        <Sidebar />
      ) : (
        <>
          <TopBar onOpenMenu={() => setDrawerOpen(true)} menuButtonRef={hamburgerRef} />
          {drawerOpen && (
            <div className="fixed inset-0 z-40">
              <div
                className="gd-modal-overlay fixed inset-0"
                aria-hidden="true"
                onClick={closeDrawer}
                data-testid="drawer-overlay"
              />
              <div
                role="dialog"
                aria-modal="true"
                data-testid="drawer-panel"
                className="motion-safe:animate-slide-in-left fixed inset-y-0 left-0 h-full w-72 max-w-[85vw]"
              >
                <Sidebar
                  variant="drawer"
                  onNavigate={closeDrawer}
                  closeButtonRef={closeButtonRef}
                />
              </div>
            </div>
          )}
        </>
      )}
      <main
        className={cn(
          'min-w-0 flex-1',
          // The page scrolls inside `<main>`, not `body`, so this is the lock
          // that matters. Swap rather than add: `cn` does not merge Tailwind
          // classes, and `overflow-y-auto` is emitted after `overflow-hidden`,
          // so having both would leave the page scrollable.
          drawerOpen ? 'overflow-hidden' : 'overflow-y-auto'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
