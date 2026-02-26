import { useEffect } from "react";

import type { LayoutConfig } from "@/components/layout/layout-context";
import { useLayoutContext } from "@/components/layout/layout-context";

export function useLayoutConfig(next: LayoutConfig) {
  const { setConfig, resetConfig } = useLayoutContext();

  useEffect(() => {
    setConfig(next);
    return () => resetConfig();
  }, [next, resetConfig, setConfig]);
}
