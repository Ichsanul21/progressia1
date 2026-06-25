import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, CheckCircle2, FolderKanban, LayoutGrid, ListTodo, UserCheck, Users } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const statusColors: Record<string, string> = {
    not_started: 'secondary',
    in_progress: 'default',
    review: 'warning',
    done: 'success',
};

const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#22c55e'];

export default function Dashboard({
    stats,
    recentProjects,
    projectStatusBreakdown,
    taskStatusBreakdown,
    myProjects,
    myTasks,
    overdueTasks,
}: {
    stats: {
        total_projects: number;
        active_projects: number;
        completed_projects: number;
        total_tasks: number;
        total_team: number;
        total_clients: number;
    };
    recentProjects: {
        id: number;
        name: string;
        status: string;
        progress: number;
        vendor: { name: string } | null;
        tasks_count: number;
        created_at: string;
    }[];
    projectStatusBreakdown: Record<string, number>;
    taskStatusBreakdown: Record<string, number>;
    myProjects: { id: number; name: string; status: string; progress: number; tasks_count: number }[];
    myTasks: { id: number; name: string; status: string; priority: string; project: { id: number; name: string } }[];
    overdueTasks: number;
}) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const isClient = auth.user.role === 'client';

    const pieData = [
        { name: 'Not Started', value: projectStatusBreakdown['not_started'] || 0 },
        { name: 'In Progress', value: projectStatusBreakdown['in_progress'] || 0 },
        { name: 'Review', value: projectStatusBreakdown['review'] || 0 },
        { name: 'Done', value: projectStatusBreakdown['done'] || 0 },
    ];

    const barData = [
        { name: 'Not Started', tasks: taskStatusBreakdown['not_started'] || 0 },
        { name: 'In Progress', tasks: taskStatusBreakdown['in_progress'] || 0 },
        { name: 'Review', tasks: taskStatusBreakdown['review'] || 0 },
        { name: 'Done', tasks: taskStatusBreakdown['done'] || 0 },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">{isClient ? 'Proyek yang di-invite untuk Anda' : 'Overview of your projects'}</p>
                </div>

                {isClient ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Proyek Saya</CardTitle>
                                <FolderKanban className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.total_projects}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Aktif</CardTitle>
                                <LayoutGrid className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.active_projects}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Selesai</CardTitle>
                                <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.completed_projects}</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                                <FolderKanban className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.total_projects}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Active</CardTitle>
                                <LayoutGrid className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.active_projects}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.completed_projects}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                                <ListTodo className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.total_tasks}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Team</CardTitle>
                                <Users className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.total_team}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                                <UserCheck className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.total_clients}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                <AlertTriangle className={`h-4 w-4 ${overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <p className={`text-2xl font-bold ${overdueTasks > 0 ? 'text-destructive' : ''}`}>{overdueTasks}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {!isClient && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Project Status</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Task Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={barData}>
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                                            {barData.map((_, index) => (
                                                <Cell key={index} fill={COLORS[index]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {!isClient && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base">My Tasks</CardTitle>
                                <div className="flex items-center gap-2">
                                    {overdueTasks > 0 && (
                                        <Badge variant="destructive" className="text-xs">
                                            {overdueTasks} overdue
                                        </Badge>
                                    )}
                                    <Link href="/tasks/inbox">
                                        <Button variant="ghost" size="sm">
                                            View all <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {myTasks.length === 0 ? (
                                    <p className="text-muted-foreground py-4 text-center text-sm">No tasks assigned to you.</p>
                                ) : (
                                    myTasks.map((t) => (
                                        <Link
                                            key={t.id}
                                            href={route('projects.tasks.show', [t.project.id, t.id])}
                                            className="hover:bg-accent/50 block rounded-lg border p-3 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{t.name}</p>
                                                    <p className="text-muted-foreground text-xs">{t.project.name}</p>
                                                </div>
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
                                                    className="ml-2 shrink-0 text-[10px]"
                                                >
                                                    {t.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-base">Recent Projects</CardTitle>
                                <Link href="/projects">
                                    <Button variant="ghost" size="sm">
                                        View all <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recentProjects.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={route('projects.show', p.id)}
                                        className="hover:bg-accent/50 block rounded-lg border p-3 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{p.name}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {p.vendor?.name} &middot; {p.tasks_count} tasks
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    statusColors[p.status] as
                                                        | 'default'
                                                        | 'secondary'
                                                        | 'destructive'
                                                        | 'outline'
                                                        | 'warning'
                                                        | 'success'
                                                }
                                                className="ml-2 shrink-0"
                                            >
                                                {p.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="bg-secondary mt-2 h-1.5 w-full rounded-full">
                                            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                                        </div>
                                    </Link>
                                ))}
                                {recentProjects.length === 0 && <p className="text-muted-foreground py-4 text-center text-sm">No projects yet.</p>}
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">{isClient ? 'Proyek Saya' : 'My Projects'}</CardTitle>
                        <Link href="/projects">
                            <Button variant="ghost" size="sm">
                                View all <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {myProjects.map((p) => (
                                <Link
                                    key={p.id}
                                    href={route('projects.show', p.id)}
                                    className="hover:border-primary/50 block rounded-lg border p-4 transition-colors"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="truncate text-sm font-medium">{p.name}</p>
                                        <Badge
                                            variant={
                                                statusColors[p.status] as 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'
                                            }
                                            className="ml-2 shrink-0 text-[10px]"
                                        >
                                            {p.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="mb-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span>{p.progress}%</span>
                                        </div>
                                        <div className="bg-secondary mt-1 h-1.5 w-full rounded-full">
                                            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground text-xs">{p.tasks_count} tasks</p>
                                </Link>
                            ))}
                            {myProjects.length === 0 && (
                                <div className="text-muted-foreground col-span-full py-8 text-center text-sm">
                                    <p>{isClient ? 'Belum ada proyek yang di-invite untuk Anda.' : 'No projects assigned to you yet.'}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
