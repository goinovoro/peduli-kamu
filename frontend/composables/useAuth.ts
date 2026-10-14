import { dashboardPath } from '@/lib/roles';
import type { BackendRole } from '@/lib/roles';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  accountStatus?: string;
  createdAt?: string;
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null);
  const api = useApi();

  async function fetchMe() {
    try {
      user.value = await api<AuthUser>('/auth/me');
    } catch {
      user.value = null;
    }
    return user.value;
  }

  async function login(email: string, password: string) {
    const res = await api<{ user: AuthUser }>('/auth/login', { method: 'POST', body: { email, password } });
    user.value = res.user;
    return navigateTo(dashboardPath(user.value.role));
  }

  async function register(payload: Record<string, any>) {
    const res = await api<{ user: AuthUser }>('/auth/register', { method: 'POST', body: payload });
    user.value = res.user;
    return navigateTo(dashboardPath(user.value.role));
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => null);
    user.value = null;
    return navigateTo('/');
  }

  return { user, fetchMe, login, register, logout };
}
