import type React from "react";

import SEOHead from "@/components/SEOHead";
import AdvisoryNotice from "@/components/AdvisoryNotice";
import UserContextBanner from "@/components/UserContextBanner";
import LayoutFooter from "@/components/layout/LayoutFooter";
import LayoutHeader from "@/components/layout/LayoutHeader";
import { useLayoutContext } from "@/components/layout/layout-context";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
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

      <main className="flex-1 bg-gradient-to-b from-background via-background to-secondary/10">
        {config.seo && (
          <SEOHead titleKey={config.seo.titleKey} descriptionKey={config.seo.descriptionKey} path={config.seo.path} />
        )}

        {config.disableContentWrapper ? (
          <div style={config.contentStyle}>{content}</div>
        ) : (
          <div className={config.contentClassName} style={config.contentStyle}>
            {content}
          </div>
        )}
      </main>

      <LayoutFooter />
    </div>
  );
}
