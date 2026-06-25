import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';

import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Notifications', href: '/notifications' }];

interface Notification {
    id: number;
    type: string;
    title: string;
    body: string | null;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsIndex({
    notifications,
    filters,
}: {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters?: { read?: string; type?: string };
}) {
    const [readFilter, setReadFilter] = useState(filters?.read ?? '');

    const markRead = (id: number) => {
        router.post(route('notifications.mark-read', id), {}, { preserveScroll: true });
    };

    const markAllRead = () => {
        router.post(route('notifications.mark-all-read'), {}, { preserveScroll: true });
    };

    const handleFilter = (read: string) => {
        setReadFilter(read);
        router.get(route('notifications.index'), { read: read || undefined }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground text-sm">Stay updated with project activity</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={markAllRead}>
                        <CheckCheck className="mr-1 h-4 w-4" />
                        Mark all read
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['', 'unread', 'read'].map((f) => (
                        <Button key={f} variant={readFilter === f ? 'default' : 'outline'} size="sm" onClick={() => handleFilter(f)}>
                            {f ? f.charAt(0).toUpperCase() + f.slice(1) : 'All'}
                        </Button>
                    ))}
                </div>

                <div className="space-y-3">
                    {notifications.data.map((n) => (
                        <Card key={n.id} className={n.is_read ? '' : 'border-primary/30'}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Bell className="text-muted-foreground h-5 w-5 shrink-0" />
                                        <div>
                                            <CardTitle className="text-sm">{n.title}</CardTitle>
                                            {n.body && <p className="text-muted-foreground mt-0.5 text-xs">{n.body}</p>}
                                        </div>
                                    </div>
                                    <div className="ml-2 flex shrink-0 items-center gap-2">
                                        {!n.is_read && <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />}
                                        <span className="text-muted-foreground text-xs">{new Date(n.created_at).toLocaleDateString('id-ID')}</span>
                                        {!n.is_read && (
                                            <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                                                <CheckCheck className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}

                    <Pagination pagination={notifications} />

                    {notifications.data.length === 0 && (
                        <div className="text-muted-foreground py-12 text-center">
                            <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                            <p>No notifications yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
