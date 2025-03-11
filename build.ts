import * as esbuild from "npm:esbuild@0.20.2";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.1";

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
