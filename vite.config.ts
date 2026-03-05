import { defineConfig, type PluginOption, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react() as unknown as PluginOption];

  if (mode === "development") {
    plugins.push(componentTagger() as unknown as PluginOption);
  }

  const config: UserConfig = {
    server: {
      host: "::",
      port: 1407,
      hmr: {
        overlay: false,
      },
    },
    plugins,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;

            // Force React into its own chunk and ensure it's loaded first
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")) {
              return "react";
            }

            if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run/") || id.includes("node_modules/history/")) {
              return "router";
            }

            if (id.includes("node_modules/@tanstack/")) {
              return "tanstack";
            }

            if (id.includes("node_modules/react-helmet-async/") || id.includes("node_modules/@remix-run/router/") && id.includes("helmet")) {
              return "helmet";
            }

            if (id.includes("node_modules/i18next/") || id.includes("node_modules/react-i18next/") || id.includes("node_modules/intl-messageformat/") || id.includes("node_modules/@formatjs/")) {
              return "i18n";
            }

            if (id.includes("node_modules/sonner/") || id.includes("node_modules/@radix-ui/react-toast/")) {
              return "toasts";
            }

            if (id.includes("node_modules/@radix-ui/") || id.includes("node_modules/radix-ui/")) {
              return "radix";
            }

            if (id.includes("node_modules/lucide-react/")) {
              return "icons";
            }

            if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3-")) {
              return "charts";
            }

            if (id.includes("node_modules/html2canvas/")) {
              return "html2canvas";
            }

            if (id.includes("node_modules/react-markdown/") || id.includes("node_modules/remark-") || id.includes("node_modules/rehype-")) {
              return "markdown";
            }

            if (id.includes("node_modules/react-iztro/") || id.includes("node_modules/iztro/") || id.includes("node_modules/lunar-javascript/")) {
              return "astrology";
            }

            if (id.includes("node_modules/@supabase/")) {
              return "supabase";
            }

            if (id.includes("node_modules/motion/") || id.includes("node_modules/framer-motion/") || id.includes("node_modules/@motionone/")) {
              return "motion";
            }

            return "vendor";
          },
        },
      },
      // Ensure proper module resolution
      target: "esnext",
      minify: "esbuild",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    define: {
      // Ensure React is available globally
      "process.env.NODE_ENV": JSON.stringify(mode === "development" ? "development" : "production"),
      // Prevent UMD bundles from using window.React
      "global.React": "global.React",
      "window.React": "window.React",
      // Environment variables for HTML substitution
      "VITE_PUBLIC_SITE_URL": JSON.stringify(process.env.VITE_PUBLIC_SITE_URL || "http://localhost:5173/"),
    },
  };

  return config;
});
