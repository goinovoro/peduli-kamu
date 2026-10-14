// Hidrasi sesi saat aplikasi dimuat (cookie HttpOnly pedulikamu_token).
// Menjamin Navbar / BottomNav / guard route punya data user tanpa reload manual.
export default defineNuxtPlugin(async () => {
  const { user, fetchMe } = useAuth();
  if (!user.value) {
    await fetchMe().catch(() => null);
  }
});
