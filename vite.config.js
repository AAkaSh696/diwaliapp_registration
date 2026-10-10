import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    // Make sure there is only one copy of React
    dedupe: ['react', 'react-dom'],

    mainFields: ['browser', 'module', 'jsnext:main', 'main'],

    alias: [
      {
        find: /^react-native-qrcode-svg$/,
        replacement: path.resolve(__dirname, 'web/QRCode.jsx'),
      },
      {
        find: /^@react-native-community\/datetimepicker$/,
        replacement: path.resolve(__dirname, 'web/DateTimePicker.jsx'),
      },
      {
        find: /^use-latest-callback$/,
        replacement: path.resolve(
          __dirname,
          'node_modules/use-latest-callback/lib/src/index.js',
        ),
      },
      {
        find: /^react-native-screens$/,
        replacement: path.resolve(__dirname, 'web/Screens.web.jsx'),
      },
      {
        find: /^react-native-safe-area-context$/,
        replacement: path.resolve(__dirname, 'web/SafeAreaContext.web.jsx'),
      },
      {
        find: /^react-native-image-picker$/,
        replacement: path.resolve(__dirname, 'web/ImagePicker.web.jsx'),
      },
      {
        find: /^inline-style-prefixer\/lib\/(.*)$/,
        replacement:
          path.resolve(__dirname, 'node_modules/inline-style-prefixer/es') +
          '/$1',
      },
      {
        find: /^react-native$/,
        // Bare package name (not a file path) so Vite's optimizer discovers
        // and pre-bundles react-native-web and all its CommonJS dependencies.
        replacement: 'react-native-web',
      },
    ],

    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
    ],
  },

  optimizeDeps: {
    include: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
      'react-native-web',
      '@react-native/normalize-colors',
      'postcss-value-parser',
      'inline-style-prefixer',
      'styleq',
      'styleq/transform-localize-style',
      'fbjs/lib/invariant',
      'fbjs/lib/warning',
      'fbjs/lib/emptyFunction',
      'nullthrows',
    ],
    exclude: ['react-native'],
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});