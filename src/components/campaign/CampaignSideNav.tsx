import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, DollarSign, CircleHelp } from 'lucide-react';

const SUPPORT_MAILTO = 'mailto:alex@trylaunch.ai?subject=Vibe%20Coded%20It%20support';

const itemBase =
  'flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

const mobileItem =
  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground';

/**
 * Campaign navigation.
 * Desktop: fixed icon rail running the full page height on the left.
 * Mobile: fixed bottom bar (Pinterest style).
 */
export const CampaignSideNav = () => {
  const { pathname } = useLocation();

  const active = (path: string) =>
    pathname === path ? 'bg-muted text-foreground' : '';

  const activeMobile = (path: string) => (pathname === path ? 'text-foreground' : '');

  return (
    <>
      <nav
        aria-label="Vibe Coded It navigation"
        className="fixed left-0 top-0 bottom-0 z-50 hidden w-16 flex-col items-center justify-between border-r border-border bg-background py-4 lg:flex"
      >
        <div className="flex flex-col items-center gap-2">
          <a href="/" aria-label="Home" title="Home" className={itemBase}>
            <Home className="h-5 w-5" />
          </a>
          <Link
            to="/ideas"
            aria-label="Explore"
            title="Explore"
            className={`${itemBase} ${active('/ideas')}`}
          >
            <Compass className="h-5 w-5" />
          </Link>
          <a
            href="https://trylaunch.ai/advertise"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Advertise"
            title="Advertise"
            className={itemBase}
          >
            <DollarSign className="h-5 w-5" />
          </a>
        </div>

        <a
          href={SUPPORT_MAILTO}
          aria-label="Support"
          title="Support"
          className={itemBase}
        >
          <Settings className="h-5 w-5" />
        </a>
      </nav>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Vibe Coded It navigation"
        className="fixed inset-x-0 bottom-[calc(53px+env(safe-area-inset-bottom))] z-50 flex border-t border-border bg-background lg:hidden"
      >
        <a href="/" aria-label="Home" className={mobileItem}>
          <Home className="h-5 w-5" />
          Home
        </a>
        <Link to="/ideas" aria-label="Explore" className={`${mobileItem} ${activeMobile('/ideas')}`}>
          <Compass className="h-5 w-5" />
          Explore
        </Link>
        <a
          href="https://trylaunch.ai/advertise"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Advertise"
          className={mobileItem}
        >
          <DollarSign className="h-5 w-5" />
          Advertise
        </a>
        <a href={SUPPORT_MAILTO} aria-label="Support" className={mobileItem}>
          <Settings className="h-5 w-5" />
          Support
        </a>
      </nav>
    </>
  );
};

export default CampaignSideNav;
