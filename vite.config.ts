import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "engaged-griffon-crucial.ngrok-free.app",
      "*.ngrok-free.app",
      "*",
    ],
  },
});
