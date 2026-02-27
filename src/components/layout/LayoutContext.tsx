import type React from "react";

import { useCallback, useMemo, useState } from "react";

import { DEFAULT_LAYOUT_CONFIG, LayoutContext, type LayoutConfig } from "@/components/layout/layout-context";

export function LayoutConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);

  const setConfig = useCallback((next: LayoutConfig) => {
    setConfigState({ ...DEFAULT_LAYOUT_CONFIG, ...next });
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_LAYOUT_CONFIG);
  }, []);

  // eslint_disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ config, setConfig, resetConfig }), [config, setConfig, resetConfig]);

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}
