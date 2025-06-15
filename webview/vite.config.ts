import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
    root: path.resolve(__dirname),
    plugins: [tailwindcss()],
    base: "./",
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, "index.html"),
            output: {
                entryFileNames: "assets/index.js", // static names
                assetFileNames: "assets/index.css",
            },
        },
    },
});
