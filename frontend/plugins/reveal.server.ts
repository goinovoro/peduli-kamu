// Stub server untuk v-reveal agar SSR/prerender tidak crash
// ("Cannot read properties of undefined (reading 'getSSRProps')").
// Animasi reveal tetap murni client-side (reveal.client.ts).
// Versi server: render apa adanya tanpa class animasi.

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {});
});
