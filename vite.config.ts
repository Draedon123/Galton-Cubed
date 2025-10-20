import { defineConfig } from "vite";

const additionalHMR: RegExp = /\.wgsl$/;

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "build",
    emptyOutDir: true,
    minify: true,
    terserOptions: {
      compress: {
        booleans_as_integers: true,
        ecma: 2020,
        expression: true,
        keep_fargs: false,
        module: true,
        toplevel: true,
        passes: 3,
        unsafe: true,
      },
      mangle: {
        module: true,
        toplevel: true,
      },
      format: {
        comments: false,
        indent_level: 0,
      },
    },
  },
  base: "/Galton-Cubed",
  publicDir: "assets",
  plugins: [
    {
      name: "WGSL HMR",
      handleHotUpdate(ctx) {
        if (!ctx.file.match(additionalHMR)) {
          return;
        }

        ctx.server.ws.send({ type: "full-reload" });
      },
    },
  ],
});
