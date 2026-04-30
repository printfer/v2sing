import { denoPlugins } from "@luca/esbuild-deno-loader";
import * as esbuild from "esbuild";

await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ["main.ts"],
  outfile: "./dist/worker.js",
  bundle: true,
  platform: "browser",
  format: "esm",
  minify: true,
  treeShaking: true,
  drop: ["console", "debugger"],
  loader: {
    ".json": "json",
  },
});

esbuild.stop();
