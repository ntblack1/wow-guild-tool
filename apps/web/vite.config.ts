import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: "../..",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("react-router") || id.includes("react-dom") || /node_modules[\\/]react[\\/]/.test(id)) {
            return "react-vendor";
          }
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("framer-motion")) return "motion-vendor";
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
