import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CampaignHeader from '@/components/campaign/CampaignHeader';
import CampaignSideNav from '@/components/campaign/CampaignSideNav';
import CollectionsPreview from '@/components/CollectionsPreview';
import { CAMPAIGN_ORIGIN } from '@/lib/campaignHost';
import { CAMPAIGN_SLUG, setCampaignIntent, trackCampaignEvent } from '@/lib/campaign';


const VibeCodedItCollections = () => {
  const navigate = useNavigate();
  const [collectionCount, setCollectionCount] = useState(0);
  const pageUrl = `${CAMPAIGN_ORIGIN}/collections`;

  const handleAddYourApp = () => {
    promptSubmitChoice(() => navigate('/submit'));
  };

  return (
    <>
      <Helmet>
        <title>Collections — Vibe Coded It</title>
        <meta
          name="description"
          content="Browse curated collections of vibe coded apps and startups, hand-picked by the Launch community."
        />
        <link rel="canonical" href={pageUrl} />
        <link rel="icon" href="/favicon-vibecodedit.png" type="image/png" />
      </Helmet>

      <CampaignHeader />
      <CampaignSideNav />

      <main className="lg:pl-20">
        <div className="w-full px-4 pt-4 pb-8">
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-5">
            {collectionCount > 0 && (
              <><span className="font-semibold text-foreground">{collectionCount.toLocaleString()}</span> curated sets of vibe coded apps from the Launch community</>
            )}
          </p>

          <div className="mt-8">
            <CollectionsPreview limit={60} onCount={setCollectionCount} openInNewWindow showMore />
          </div>
        </div>
      </main>

      {/* Floating Submit Your App CTA */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <Button
          size="lg"
          className="h-12 gap-2 px-6 text-base shadow-lg"
          onClick={handleAddYourApp}
        >
          Submit Your App
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-[64px] lg:hidden" aria-hidden />
    </>
  );
};

export default VibeCodedItCollections;
