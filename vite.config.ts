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
      // Environment variables for HTML substitution
      "VITE_PUBLIC_SITE_URL": JSON.stringify(process.env.VITE_PUBLIC_SITE_URL || "http://localhost:5173/"),
    },
  };

  return config;
});
