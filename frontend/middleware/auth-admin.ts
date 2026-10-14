export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchMe } = useAuth();
  if (!user.value) await fetchMe();
  if (!user.value) return navigateTo('/auth');
  const { toRoleGroup } = await import('@/lib/roles');
  if (toRoleGroup(user.value.role) !== 'admin') return navigateTo('/auth');
});
