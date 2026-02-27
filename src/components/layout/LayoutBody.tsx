import type React from "react";

import { useLayoutContext } from "@/components/layout/layout-context";

export default function LayoutBody({ children }: { children: React.ReactNode }) {
  const { config } = useLayoutContext();

  if (config.disableContentWrapper) {
    return <div style={config.contentStyle}>{children}</div>;
  }

  return (
    <div className={config.contentClassName} style={config.contentStyle}>
      {children}
    </div>
  );
}
