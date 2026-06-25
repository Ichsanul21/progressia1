import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NotificationBell() {
    const [count, setCount] = useState(0);
    const [latest, setLatest] = useState<{ id: number; title: string; created_at: string }[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetch(route('notifications.unread'))
            .then((r) => r.json())
            .then((data) => {
                setCount(data.count);
                setLatest(data.latest);
            });

        const interval = setInterval(() => {
            fetch(route('notifications.unread'))
                .then((r) => r.json())
                .then((data) => {
                    setCount(data.count);
                    setLatest(data.latest);
                });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const markRead = (id: number) => {
        router.post(
            route('notifications.mark-read', id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLatest((prev) => prev.filter((n) => n.id !== id));
                    setCount((c) => Math.max(0, c - 1));
                },
            },
        );
    };

    return (
        <div className="relative">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
                <Bell className="h-5 w-5" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </Button>
            {open && (
                <div className="bg-background absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border shadow-lg">
                    <div className="flex items-center justify-between border-b p-3">
                        <span className="text-sm font-medium">Notifications</span>
                        <Link href={route('notifications.index')} className="text-primary text-xs underline" onClick={() => setOpen(false)}>
                            View all
                        </Link>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                        {latest.length === 0 && <p className="text-muted-foreground p-4 text-center text-sm">No new notifications.</p>}
                        {latest.map((n) => (
                            <div key={n.id} className="flex items-start justify-between border-b p-3 last:border-0">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{n.title}</p>
                                    <p className="text-muted-foreground text-xs">{new Date(n.created_at).toLocaleDateString('id-ID')}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => markRead(n.id)}>
                                    <span className="text-xs">Read</span>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
