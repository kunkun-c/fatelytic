import type React from "react";

import LayoutShell from "@/components/layout/LayoutShell";
import { LayoutConfigProvider } from "@/components/layout/LayoutContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutConfigProvider>
      <LayoutShell>{children}</LayoutShell>
    </LayoutConfigProvider>
  );
}
