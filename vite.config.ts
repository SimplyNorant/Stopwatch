import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    VitePWA({
      // Ключевое изменение: стратегия injectManifest
      strategies: "injectManifest",
      srcDir: "public", // папка, где лежит ваш кастомный sw.js
      filename: "sw.js", // имя вашего файла
      injectRegister: "auto", // оставляем авторегистрацию
      manifest: {
        name: "Stopwatches",
        short_name: "Stopwatches",
        theme_color: "#ffffff",
        icons: [
          {
            src: "images/clock192.png",
            sizes: "192x192",
            type: "images/png",
          },
          {
            src: "images/clock512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
