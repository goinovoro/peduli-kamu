// Notifikasi in-app (MVP): polling ringan untuk badge bell + daftar.
// Endpoint: GET /notifications/me, GET /notifications/unread-count,
// PATCH /notifications/:id/read, POST /notifications/read-all

export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const api = useApi();
  const { user } = useAuth();

  const unread = useState<number>('notif-unread', () => 0);

  async function refreshUnread() {
    if (!user.value) {
      unread.value = 0;
      return 0;
    }
    try {
      const res = await api<{ count: number }>('/notifications/unread-count');
      unread.value = res.count ?? 0;
    } catch {
      // abaikan — badge tidak boleh merusak halaman
    }
    return unread.value;
  }

  async function markRead(id: string) {
    await api(`/notifications/${id}/read`, { method: 'PATCH' }).catch(() => null);
    await refreshUnread();
  }

  async function markAllRead() {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => null);
    unread.value = 0;
  }

  return { unread, refreshUnread, markRead, markAllRead };
}
