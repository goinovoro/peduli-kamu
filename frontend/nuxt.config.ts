// PeduliKamu Frontend — Nuxt 3 SSR + SEO matang
// Migrasi UI dari Next.js src/ ke Nuxt pages/
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export default defineNuxtConfig({
  ssr: true,
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/seo'],

  // Stylesheet global berisi directive @tailwind + token tema. Wajib didaftarkan,
  // jika tidak, utilitas Tailwind tidak pernah di-generate.
  css: ['~/assets/css/main.css'],

  alias: {
    '@': new URL('./', import.meta.url).pathname,
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1',
      siteUrl,
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'id' },
      titleTemplate: '%s | Peduli Kamu',
      meta: [
        { name: 'description', content: 'Menghubungkan keluarga Indonesia dengan lulusan perawat bersertifikat untuk home care terpercaya.' },
        { name: 'theme-color', content: '#0284c7' },
        { property: 'og:locale', content: 'id_ID' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  site: {
    url: siteUrl,
    name: 'Peduli Kamu',
    description: 'Perawatan di rumah yang terpercaya dari hati.',
    defaultLocale: 'id',
  },

  sitemap: {
    // Sumber URL dinamis ditambahkan saat rute server /api/__sitemap__/urls tersedia.
    // Dikosongkan agar `nuxt build` (prerender /sitemap.xml) tidak gagal 404.
  },

  robots: {
    allow: ['/'],
    disallow: ['/family/dashboard', '/family/pembayaran', '/family/approval', '/mitra/dashboard', '/auth', '/admin', '/notifikasi', '/mitra', '/chat'],
  },

  nitro: {
    prerender: {
      routes: ['/', '/sitemap.xml', '/robots.txt'],
    },
  },

  routeRules: {
    // Publik → SSR + cache untuk SEO
    '/': { prerender: true },
    '/family/find': { ssr: true, isr: 60 },
    '/mitra/profil/:id': { ssr: true, isr: 60 },
    // Privat → client-only, jangan di-crawl
    '/family/dashboard': { ssr: false },
    '/family/pembayaran': { ssr: false },
    '/family/approval': { ssr: false },
    '/mitra/dashboard': { ssr: false },
    '/mitra/**': { ssr: false },
    '/notifikasi': { ssr: false },
    '/chat': { ssr: false },
    '/admin/**': { ssr: false },
    '/auth': { ssr: false },
  },
});
