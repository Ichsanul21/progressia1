import { Head, Link, router } from '@inertiajs/react';
import { Gantt, ViewMode, type Task } from '@rsagiev/gantt-task-react-19';
import '@rsagiev/gantt-task-react-19/dist/index.css';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Gantt', href: '' },
];

export default function GanttChart({ project, tasks }: { project: { id: number; name: string }; tasks: Task[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);

    const ganttTasks: Task[] = tasks.map((t) => ({
        ...t,
        start: new Date(t.start),
        end: new Date(t.end),
    }));

    const handleTaskClick = (task: Task) => {
        if (task.type === 'task') {
            router.get(route('projects.tasks.show', [project.id, task.id]));
        }
    };

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Gantt - ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={route('projects.tasks.index', project.id)}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{project.name} — Gantt</h1>
                            <p className="text-muted-foreground text-sm">{ganttTasks.length} items</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {([ViewMode.Day, ViewMode.Week, ViewMode.Month, ViewMode.Year] as ViewMode[]).map((mode) => (
                            <Button
                                key={mode}
                                variant={viewMode === mode ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleViewModeChange(mode)}
                            >
                                {mode}
                            </Button>
                        ))}
                    </div>
                </div>

                <Card>
                    <CardContent className="overflow-x-auto p-4">
                        {ganttTasks.length === 0 ? (
                            <div className="text-muted-foreground py-16 text-center">
                                <p>No tasks with dates found. Create tasks with start and due dates to see the Gantt chart.</p>
                            </div>
                        ) : (
                            <div className="min-w-[800px]">
                                <Gantt
                                    tasks={ganttTasks}
                                    viewMode={viewMode}
                                    onClick={handleTaskClick}
                                    onDateChange={() => {}}
                                    onProgressChange={() => {}}
                                    onDoubleClick={handleTaskClick}
                                    listCellWidth=""
                                    columnWidth={viewMode === ViewMode.Month ? 150 : viewMode === ViewMode.Week ? 50 : 30}
                                    ganttHeight={Math.max(400, ganttTasks.length * 35)}
                                    locale="id-ID"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
