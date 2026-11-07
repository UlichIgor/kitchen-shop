import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages публікує проєкт у підпапці /kitchen-shop/
  base: "/kitchen-shop/",
  plugins: [react()],
});
