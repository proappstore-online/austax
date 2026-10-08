import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { handlePagsChat } from "./src/server/pags-input";

function pagsInputGuard() {
  const middleware = async (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    if (req.url?.split("?")[0] !== "/api/pags/chat") return next();
    try {
      const chunks: Uint8Array[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const bytes = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      const body = new TextDecoder().decode(bytes);
      const request = new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: { "Content-Type": req.headers["content-type"] ?? "application/json" },
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
      });
      // No server credential or production PAGS bridge is configured here.
      // A deployment must provide its authenticated forwarder to this handler.
      const response = await handlePagsChat(request, async () => {
        throw new Error("PAGS bridge is not configured");
      });
      res.statusCode = response.status;
      res.setHeader("Content-Type", "application/json");
      res.end(await response.text());
    } catch (error) {
      next(error);
    }
  };
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
