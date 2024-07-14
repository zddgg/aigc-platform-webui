import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite';
import { ArcoResolver, NaiveUiResolver } from 'unplugin-vue-components/resolvers';

import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ArcoResolver(), NaiveUiResolver()],
    }),
    Components({
      resolvers: [
        ArcoResolver({
          sideEffect: true
        }),
        NaiveUiResolver()
      ]
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});
