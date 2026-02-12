import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  srcDir: 'app/',

  devServer: {
    port: 3003,
  },

  modules: [
    '@pinia/nuxt',
  ],

  css: [
    '~/assets/css/main.css',
  ],

  app: {
    head: {
      title: 'PipeMagic',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
    spaLoadingTemplate: true,
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
    worker: {
      format: 'es',
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  },

  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    },
  },
})
