// Direktif v-reveal — animasi fade-up halus saat elemen masuk viewport.
// Pakai: <section v-reveal> atau <div v-reveal="{ delay: 120, scale: true }">
// Elemen di atas fold langsung terlihat; di bawah fold teranimasi saat di-scroll.

interface RevealOptions {
  delay?: number;
  scale?: boolean;
}

export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | null = null;

  function getObserver() {
    if (observer) return observer;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    return observer;
  }

  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement, binding) {
      const opts = (binding.value ?? {}) as RevealOptions;
      el.classList.add(opts.scale ? 'reveal-scale' : 'reveal');
      if (opts.delay) el.style.setProperty('--reveal-delay', `${opts.delay}ms`);
      // Elemen yang sudah terlihat saat mount langsung tampil tanpa menunggu
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')));
      } else {
        getObserver().observe(el);
      }
    },
    unmounted(el: HTMLElement) {
      observer?.unobserve(el);
    },
  });
});
