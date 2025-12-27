import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: "manifest.json",
                    dest: ".",
                },
                {
                    src: "rules.json",
                    dest: ".",
                },
                {
                    src: "public/icons",
                    dest: ".",
                },
            ],
        }),
    ],
    build: {
        outDir: "dist",
        rollupOptions: {
            input: {
                popup: path.resolve(__dirname, "index.html"),
                background: path.resolve(__dirname, "src/background.ts"),
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    return chunkInfo.name === "background" ? "[name].js" : "assets/[name]-[hash].js";
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
