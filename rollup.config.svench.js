import * as path from "path";
import del from "rollup-plugin-delete";
import { svenchify } from "svench/rollup";

const isWatch = !!process.env.ROLLUP_WATCH;

const svenchDist = ".svench/dist";

export default svenchify("./rollup.config.js", {
  override: {
    // replace input with a Svench entry point (here a custom one)
    // input: '.svench/svench.js',
    input: true,

    output: {
      // change output format to ES module
      format: "es",
      // remove the file from the original config (can't have file & dir)
      file: null,
      // and change to a dir (code splitting outputs multiple files)
      dir: svenchDist,
      // ensure we know the name of our entry point (useful when input file is
      // not named svench.js)
      entryFileNames: "svench.js",
    },

    plugins: (plugins) => [
      // NOTE del is needed to avoid serving stale static files that would
      // shadow Nollup's in-memory files
      del({ targets: ".svench/dist/*", runOnce: true }),
      ...plugins,
      // postcss({ hot }),
    ],
  },

  svelte: {
    hot: isWatch,
    css: (css) => {
      css.write("bundle.css");
    },
  },

  index: {
    // Start from your own index.html
    source: "public/index.html",
    // This does dumb full text replacements (maybe we'll go with something
    // more elaborate in the future!)
    replace: {
      "<script defer src='/build/bundle.js'>":
        '<script defer type="module" src="/svench.js">',
      "/build/bundle.css": "/bundle.css",
      "PostScript Medical": "PostScript Medical Svench",
    },
    // Write the result to disk (if you don't use Svench dev server, or if
    // you want to build your Svench workbench as a standalone app)
    output: path.join(svenchDist, "/index.html"),
  },

  serve: {
    host: "0.0.0.0",
    port: 4242,
    public: [svenchDist, "public"],
    nollup: { port: "42421" },
  },
});
