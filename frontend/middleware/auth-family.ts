import { toRoleGroup, dashboardPath } from '@/lib/roles';

export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchMe } = useAuth();
  if (!user.value) await fetchMe();
  if (!user.value) return navigateTo('/auth');
  const g = toRoleGroup(user.value.role);
  if (g === 'admin') return navigateTo('/admin');
  if (g !== 'pasien') return navigateTo(dashboardPath(user.value.role));
});
