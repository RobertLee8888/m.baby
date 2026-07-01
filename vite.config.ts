import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => ({
  base: command === "build" || mode === "production" ? "/m.baby/" : "/",
  plugins: [react()],
}));
