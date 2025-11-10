import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  entry: {
    background: './src/background/service-worker.js',
    content: './src/content/content-script.js',
    options: './src/options/options.js',
    popup: './src/popup/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/options/options.html', to: 'options.html' },
        { from: 'src/options/options.css', to: 'options.css' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/popup/popup.css', to: 'popup.css' },
        { from: 'src/content/content-script.css', to: 'content-script.css' },
        { from: 'icons', to: 'icons' },
        { from: 'src/locales', to: '_locales' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js'],
    fallback: {
      "crypto": false,
      "stream": false,
      "buffer": false,
      "util": false,
      "process": false
    }
  },
  devtool: 'cheap-source-map',
  optimization: {
    minimize: false
  }
};
