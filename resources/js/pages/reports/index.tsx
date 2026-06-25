import { Head } from '@inertiajs/react';
import { BarChart3, CheckCircle2, Clock, File as FileIcon, FileSpreadsheet, FileText, FolderKanban, ListTodo, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reports', href: '/reports' }];

interface Stats {
    totalProjects: number;
    completedProjects: number;
    inProgressProjects: number;
    totalTasks: number;
    completedTasks: number;
    averageProgress: number;
}

interface RecentActivity {
    id: number;
    name: string;
    status: string;
    progress: number;
    updated_at: string;
}

const statusLabel: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
};

const statusColor: Record<string, string> = {
    not_started: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    review: 'bg-yellow-500',
    done: 'bg-green-500',
};

export default function ReportsIndex({
    stats,
    statusBreakdown,
    recentActivity,
}: {
    stats: Stats;
    statusBreakdown: Record<string, number>;
    recentActivity: RecentActivity[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Reports</h1>
                        <p className="text-muted-foreground text-sm">Overview of project and task performance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={route('reports.export', { format: 'xlsx' })}>
                            <Button variant="outline" size="sm">
                                <FileSpreadsheet className="mr-1 h-4 w-4" /> XLSX
                            </Button>
                        </a>
                        <a href={route('reports.export', { format: 'csv' })}>
                            <Button variant="outline" size="sm">
                                <FileText className="mr-1 h-4 w-4" /> CSV
                            </Button>
                        </a>
                        <a href={route('reports.export', { format: 'pdf' })}>
                            <Button variant="outline" size="sm">
                                <FileIcon className="mr-1 h-4 w-4" /> PDF
                            </Button>
                        </a>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                            <FolderKanban className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalProjects}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{stats.completedProjects}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">{stats.inProgressProjects}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                            <ListTodo className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTasks}</div>
                            {stats.totalTasks > 0 && (
                                <p className="text-muted-foreground text-xs">
                                    {stats.completedTasks} completed ({Math.round((stats.completedTasks / stats.totalTasks) * 100)}%)
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                            <TrendingUp className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
                            <Progress value={stats.averageProgress} className="mt-2 h-2" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
                            <BarChart3 className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(statusBreakdown).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${statusColor[status] || 'bg-gray-500'}`} />
                                            <span>{statusLabel[status] || status}</span>
                                        </div>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                                {Object.keys(statusBreakdown).length === 0 && <p className="text-muted-foreground text-xs">No projects yet</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentActivity.map((project) => (
                                <div key={project.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{project.name}</p>
                                        <p className="text-muted-foreground text-xs">{new Date(project.updated_at).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div className="ml-2 flex shrink-0 items-center gap-2">
                                        <Badge variant="outline">{statusLabel[project.status] || project.status}</Badge>
                                        <span className="text-muted-foreground w-8 text-right text-xs">{project.progress}%</span>
                                    </div>
                                </div>
                            ))}
                            {recentActivity.length === 0 && <p className="text-muted-foreground text-sm">No activity yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
