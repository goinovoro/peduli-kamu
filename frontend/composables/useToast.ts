// Toast global ringan (tanpa dependensi) — alert sesuai response backend.
// Pakai: const toast = useToast(); toast.success('...'); toast.error(msg)

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

let seq = 0;

export function useToast() {
  const toasts = useState<ToastItem[]>('ui-toasts', () => []);

  function push(type: ToastItem['type'], title: string, message?: string, timeout = 4500) {
    const id = ++seq;
    toasts.value.push({ id, type, title, message });
    if (timeout > 0) {
      setTimeout(() => dismiss(id), timeout);
    }
    return id;
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    dismiss,
    success: (title: string, message?: string) => push('success', title, message),
    error: (title: string, message?: string) => push('error', title, message),
    warning: (title: string, message?: string) => push('warning', title, message),
    info: (title: string, message?: string) => push('info', title, message),
  };
}
