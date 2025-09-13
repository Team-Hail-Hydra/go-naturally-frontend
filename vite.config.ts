import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "engaged-griffon-crucial.ngrok-free.app",
      "*.ngrok-free.app",
      "*",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
