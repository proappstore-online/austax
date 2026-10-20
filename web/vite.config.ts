import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { pagsChatMiddleware as middleware } from "./src/server/pags-dev-middleware";

function pagsInputGuard() {
  return {
    name: "austax-pags-input-guard",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server: import("vite").PreviewServer) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pagsInputGuard(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2,json}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/\.pas\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-webfonts" },
          },
        ],
      },
    }),
  ],
});
