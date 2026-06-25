import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Clock, ListTodo } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Tasks', href: '/tasks/inbox' },
];

const statusColors: Record<string, string> = {
    not_started: 'secondary',
    in_progress: 'default',
    review: 'warning',
    done: 'success',
};

const priorityColors: Record<string, string> = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
};

export default function Inbox({
    tasks,
    filters,
}: {
    tasks: {
        data: {
            id: number;
            name: string;
            status: string;
            priority: string;
            due_date: string | null;
            is_overdue: boolean;
            project: { id: number; name: string };
            phase: { name: string } | null;
        }[];
    };
    filters?: { status?: string };
}) {
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');

    const handleFilter = (status: string) => {
        setStatusFilter(status);
        router.get(route('tasks.inbox'), { status: status || undefined }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Tasks" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">My Tasks</h1>
                        <p className="text-muted-foreground text-sm">Tasks assigned to you</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-1 h-3 w-3" /> Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['', 'not_started', 'in_progress', 'review', 'done'].map((s) => (
                        <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => handleFilter(s)}>
                            {s ? s.replace('_', ' ') : 'All'}
                        </Button>
                    ))}
                </div>

                <Card>
                    <CardContent className="pt-6">
                        {tasks.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <ListTodo className="text-muted-foreground mb-4 h-12 w-12" />
                                <p className="text-muted-foreground text-lg font-medium">No tasks assigned to you</p>
                                <p className="text-muted-foreground text-sm">When someone assigns a task to you, it will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tasks.data.map((t) => (
                                    <Link
                                        key={t.id}
                                        href={route('projects.tasks.show', [t.project.id, t.id])}
                                        className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-medium">{t.name}</p>
                                                <Badge
                                                    variant={
                                                        statusColors[t.status] as
                                                            | 'default'
                                                            | 'secondary'
                                                            | 'destructive'
                                                            | 'outline'
                                                            | 'warning'
                                                            | 'success'
                                                    }
                                                    className="shrink-0 text-[10px]"
                                                >
                                                    {t.status.replace('_', ' ')}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        priorityColors[t.priority] as
                                                            | 'default'
                                                            | 'secondary'
                                                            | 'destructive'
                                                            | 'outline'
                                                            | 'warning'
                                                            | 'success'
                                                    }
                                                    className="shrink-0 text-[10px]"
                                                >
                                                    {t.priority}
                                                </Badge>
                                            </div>
                                            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                                                <span>{t.project.name}</span>
                                                {t.phase && <span>&middot; {t.phase.name}</span>}
                                                {t.due_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(t.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {t.is_overdue && (
                                                    <span className="text-destructive flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
