import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import vibeLogo from '@/assets/vibecodedit-logo-6.png.asset.json';
import vibeLogoDark from '@/assets/vibecodedit-logo-dark-6.png.asset.json';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { trackCampaignEvent } from '@/lib/campaign';

/** Shared campaign header: logo, full-width on-site search, theme toggle, submit CTA. */
export const CampaignHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const urlQuery = pathname === '/' ? searchParams.get('q') ?? '' : '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);

  // Keep the input in sync when the URL changes (back button, cleared search).
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  // Debounced on-site search: filters the app wall on the home page.
  useEffect(() => {
    const value = searchQuery.trim();
    if (value === urlQuery.trim()) return;

    const timer = window.setTimeout(() => {
      if (value) {
        trackCampaignEvent('campaign_search_submitted');
        navigate(`/?q=${encodeURIComponent(value)}`, { replace: pathname === '/' });
      } else if (pathname === '/') {
        navigate('/', { replace: true });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, urlQuery, pathname, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      document.getElementById('apps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (e.key === 'Escape') setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex h-14 md:h-16 w-full items-center gap-4 px-4 lg:pl-20">
        <a href="/" aria-label="Vibe Coded It" className="flex flex-shrink-0 items-center">
          <img src={vibeLogo.url} alt="Vibe Coded It" width={200} height={40} className="h-9 md:h-10 w-auto object-contain dark:hidden" />
          <img src={vibeLogoDark.url} alt="Vibe Coded It" width={200} height={40} className="hidden h-9 md:h-10 w-auto object-contain dark:block" />
        </a>

        <div className="min-w-0 flex-1">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              aria-label="Search apps"
              placeholder="Search apps, founders, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button asChild size="sm">
            <a href="/submit">Submit</a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default CampaignHeader;
