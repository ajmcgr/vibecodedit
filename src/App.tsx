import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SideAdRails from "@/components/SideAdRails";

// Standalone Vibe Coded It frontend: the homepage is the campaign page.
// Everything account/payment/submission related lives on trylaunch.ai.
const VibeCodedIt = lazy(() => import("./pages/VibeCodedIt"));
const VibeCodedItCollections = lazy(() => import("./pages/VibeCodedItCollections"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const location = useLocation();
  const isCampaignCollections = location.pathname === '/collections';
  const isCampaignPage = location.pathname === '/' || isCampaignCollections;

  return (
    <div className="flex flex-col min-h-screen">
      <SideAdRails isCampaignPage={isCampaignPage} />
      <main className="flex-1">

        <Suspense fallback={
          isCampaignCollections ? (
            <div className="min-h-screen bg-background" aria-label="Loading" role="status">
              {/* campaign header */}
              <div className="border-b border-border/60">
                <div className="lg:pl-20 px-4 h-16 flex items-center gap-6">
                  <div className="h-10 w-10 rounded-lg bg-muted/60 animate-pulse lg:hidden" />
                  <div className="flex-1">
                    <div className="h-9 w-full rounded-md bg-muted/50 animate-pulse" />
                  </div>
                </div>
              </div>
              {/* left nav rail */}
              <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center gap-6 border-r border-border/60 pt-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 w-10 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
              <div className="lg:pl-20 min-[1700px]:pr-[200px]">
                <div className="w-full px-4 pt-4 pb-8">
                  <div className="h-8 w-48 rounded-md bg-muted/60 animate-pulse" />
                  <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted/50 animate-pulse" />
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="flex flex-col rounded-xl overflow-hidden border bg-card">
                        <div className="aspect-[3/1.6] w-full bg-muted/50 animate-pulse" />
                        <div className="p-4 space-y-2">
                          <div className="h-5 w-2/3 rounded bg-muted/60 animate-pulse" />
                          <div className="h-4 w-full rounded bg-muted/50 animate-pulse" />
                          <div className="h-4 w-4/5 rounded bg-muted/50 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <span className="sr-only">Loading</span>
            </div>
          ) : (
            <div className="min-h-screen bg-background" aria-label="Loading" role="status">
              {/* header: logo + nav left, search centered, auth right */}
              <div className="border-b border-border/60">
                <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center gap-6">
                  <div className="h-10 w-10 rounded-lg bg-muted/60 animate-pulse" />
                  <div className="hidden md:flex items-center gap-4">
                    <div className="h-4 w-20 rounded bg-muted/50 animate-pulse" />
                    <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="h-9 w-full max-w-md rounded-md bg-muted/50 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-12 rounded bg-muted/50 animate-pulse" />
                    <div className="h-9 w-20 rounded-md bg-muted/60 animate-pulse" />
                  </div>
                </div>
              </div>
              {/* hero */}
              <div className="container mx-auto max-w-7xl px-4 pt-10 pb-8 flex flex-col items-center gap-4">
                <div className="h-12 w-4/5 max-w-2xl rounded-md bg-muted/60 animate-pulse" />
                <div className="h-5 w-2/3 max-w-xl rounded bg-muted/50 animate-pulse" />
                <div className="mt-2 h-11 w-44 rounded-md bg-muted/60 animate-pulse" />
              </div>
              {/* builder wall grid */}
              <div className="container mx-auto max-w-7xl px-4 pb-16">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-5">
                      <div className="flex items-start gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-muted/60 animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-muted/60 animate-pulse" />
                          <div className="h-3 w-1/3 rounded bg-muted/50 animate-pulse" />
                        </div>
                      </div>
                      <div className="mt-3 aspect-video w-full rounded-lg bg-muted/50 animate-pulse" />
                      <div className="mt-2 space-y-2">
                        <div className="h-3 w-full rounded bg-muted/50 animate-pulse" />
                        <div className="h-3 w-4/5 rounded bg-muted/50 animate-pulse" />
                      </div>
                      <div className="mt-4 h-6 w-24 rounded-full bg-muted/50 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
              <span className="sr-only">Loading</span>
            </div>
          )
        }>
          <Routes>
            <Route path="/" element={<VibeCodedIt />} />
            <Route path="/collections" element={<VibeCodedItCollections />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer minimal />
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
