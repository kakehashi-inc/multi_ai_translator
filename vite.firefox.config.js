import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist-firefox',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.html',
        options: 'src/options/options.html',
        'service-worker': 'src/background/service-worker.js',
        'content-script': 'src/content/content-script.js'
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
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
    })
  ],
  resolve: {
    alias: {
      'webextension-polyfill': 'webextension-polyfill'
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
