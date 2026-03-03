import type React from "react";

import { memo } from "react";

import SEOHead from "@/components/SEOHead";
import AdvisoryNotice from "@/components/AdvisoryNotice";
import UserContextBanner from "@/components/UserContextBanner";
import LayoutFooter from "@/components/layout/LayoutFooter";
import LayoutHeader from "@/components/layout/LayoutHeader";
import LayoutBody from "@/components/layout/LayoutBody";
import { useLayoutContext } from "@/components/layout/layout-context";
import { BubbleBackground } from "@/components/animate-ui/primitives/backgrounds/bubble";

function LayoutShell({ children }: { children: React.ReactNode }) {
  const { config } = useLayoutContext();

  const content = (
    <>
      {config.top}

      {config.showUserContextBanner && <UserContextBanner className={config.userContextBannerClassName} />}

      {config.showAdvisoryNotice && (
        <AdvisoryNotice
          compact={config.advisoryNoticeCompact}
          className={config.advisoryNoticeClassName}
        />
      )}

      {children}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LayoutHeader />

      <main className="relative flex-1 bg-gradient-to-b from-background via-background to-secondary/10">
        <BubbleBackground interactive className="absolute inset-0 z-0 opacity-50" />

        <div className="relative z-10">
          {config.seo && (
            <SEOHead
              titleKey={config.seo.titleKey}
              descriptionKey={config.seo.descriptionKey}
              path={config.seo.path}
            />
          )}

          <LayoutBody>{content}</LayoutBody>
        </div>
      </main>

      <LayoutFooter />
    </div>
  );
}

export default memo(LayoutShell);
