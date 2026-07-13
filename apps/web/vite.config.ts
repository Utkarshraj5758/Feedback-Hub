import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev server proxies /api/* to the Express api (apps/api) so the browser can
// call it without CORS, and so the httpOnly refresh cookie is same-origin. The
// /api prefix is stripped before forwarding, so /api/auth/login -> :4000/auth/login.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
