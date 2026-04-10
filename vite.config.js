import { defineConfig } from "vite";
import { resolve } from "path";
import { readFileSync } from "fs";

// Plugin to serve inex.html (PHP template) as plain HTML for dev preview
function phpTemplatePlugin() {
  return {
    name: "php-template",
    configureServer(server) {
      // Watch inex.html for changes
      server.watcher.add(resolve(__dirname, "inex.html"));

      server.middlewares.use((req, res, next) => {
        if (req.url === "/" || req.url === "/index.html") {
          let html = readFileSync(resolve(__dirname, "inex.html"), "utf-8");

          // Strip PHP tags and replace PHP variables
          html = html.replace(/<\?php[\s\S]*?\?>/g, "");
          html = html.replace(/<\?=\s*\$assets\s*\?>/g, "assets/");
          html = html.replace(/<\?=\s*\$cta_url\s*\?>/g, "#");
          html = html.replace(/<\?=\s*\$site_url\s*\?>/g, "#");

          // Inject Vite client for HMR
          html = html.replace(
            "</head>",
            `<script type="module" src="/@vite/client"></script>\n</head>`,
          );

          // Replace compiled CSS/JS with source files for HMR
          html = html.replace(
            'href="assets/css/style.min.css"',
            'href="/assets/css/style.scss" type="text/css"',
          );
          html = html.replace(
            'src="assets/js/custom.js"',
            'type="module" src="/assets/js/custom.js"',
          );

          res.setHeader("Content-Type", "text/html");
          res.end(html);
          return;
        }
        next();
      });
    },
    // Reload browser when inex.html changes
    handleHotUpdate({ file, server }) {
      if (file.endsWith("inex.html")) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
  };
}

// Plugin to remove font files from bundle output and fix CSS font paths
// Fonts already exist in assets/fonts/ — no need to copy them
function skipFontsPlugin() {
  return {
    name: "skip-fonts",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const fileName of Object.keys(bundle)) {
        // Remove font assets from the bundle
        if (fileName.match(/\.(woff2?|ttf|eot|otf)$/)) {
          delete bundle[fileName];
        }
        // Fix font URLs in CSS to point to ../fonts/
        if (fileName.endsWith(".css")) {
          const asset = bundle[fileName];
          if (asset.source) {
            asset.source = asset.source.replace(
              /url\(\.\/([^)]+\.woff2)\)/g,
              "url(../fonts/$1)",
            );
          }
        }
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [phpTemplatePlugin(), skipFontsPlugin()],
  server: {
    open: true,
    watch: {
      ignored: ["**/node_modules/**"],
    },
  },
  build: {
    outDir: "assets",
    emptyOutDir: false,
    copyPublicDir: false,
    rollupOptions: {
      input: {
        style: resolve(__dirname, "assets/css/style.scss"),
        custom: resolve(__dirname, "assets/js/custom.js"),
      },
      output: {
        entryFileNames: "js/[name].min.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/[name].min[extname]";
          }
          return "[name][extname]";
        },
      },
    },
    cssMinify: true,
    minify: "oxc",
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["import", "global-builtin"],
      },
    },
  },
});
