import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Import the tagger but only use it conditionally
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: {
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Security-Policy": "default-src 'self' https: wss: ws:; img-src 'self' data: https: *; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https: wss: ws: *;",
    },
    hmr: false, // Disable HMR to prevent frequent reloads
    allowedHosts: [
      'all',  // Allow any host
      '3s058406-8080.euw.devtunnels.ms',
      '3s058406-3000.euw.devtunnels.ms',
      '.devtunnels.ms'  // Allow all subdomains of devtunnels.ms
    ],
  },
  plugins: [
    react(),
    // Disable the lovable-tagger to prevent React.Fragment issues
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    host: 'localhost',
    port: 8080,
    strictPort: true,
  },
}));
