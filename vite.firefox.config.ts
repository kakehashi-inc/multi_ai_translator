import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { build as esbuildBuild } from 'esbuild';
import type { PluginOption } from 'vite';

const firefoxScriptTargets = [
  {
    entry: 'src/background/service-worker.ts',
    outfile: 'dist-firefox/assets/service-worker.js'
  },
  {
    entry: 'src/content/content-script.ts',
    outfile: 'dist-firefox/assets/content-script.js'
  }
];

function firefoxScriptsPlugin(): PluginOption {
  return {
    name: 'build-firefox-scripts',
    apply: 'build' as const,
    async writeBundle() {
      await Promise.all(
        firefoxScriptTargets.map(({ entry, outfile }) =>
          esbuildBuild({
            entryPoints: [entry],
            outfile,
            bundle: true,
            format: 'iife',
            target: 'es2020',
            platform: 'browser',
            define: {
              'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
            }
          })
        )
      );
    }
  };
}

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.firefox.json',
          dest: '.',
          rename: 'manifest.json'
        },
        {
          src: 'icons',
          dest: 'icons'
        },
        {
          src: 'src/locales',
          dest: '',
          rename: '_locales'
        }
      ]
    }),
    firefoxScriptsPlugin()
  ],
  build: {
    // Ensure compatibility with older browsers
    target: 'es2020',
    // Optimize output
    minify: 'esbuild',
    sourcemap: true,
    outDir: 'dist-firefox',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.html',
        options: 'src/options/options.html'
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  resolve: {
    alias: {
      // webextension-polyfill for cross-browser compatibility
      'webextension-polyfill': 'webextension-polyfill'
    }
  },
  // Ensure proper handling of web extension APIs
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
