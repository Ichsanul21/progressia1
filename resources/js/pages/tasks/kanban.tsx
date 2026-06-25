import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, LayoutGrid, List, Pencil, Plus, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import UpdateProgressModal from '@/components/update-progress-modal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Tasks', href: '' },
    { title: 'Kanban', href: '' },
];

const priorityColors: Record<string, string> = {
    low: 'secondary',
    medium: 'default',
    high: 'warning',
    urgent: 'destructive',
};

const statusColors: Record<string, string> = {
    not_started: 'secondary',
    in_progress: 'default',
    review: 'warning',
    done: 'success',
    revisi: 'destructive',
};

const columns = [
    { id: 'not_started', title: 'Not Started' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
    { id: 'revisi', title: 'Revisi' },
];

interface Task {
    id: number;
    name: string;
    status: string;
    priority: string;
    sort_order: number;
    assigned_user: { id: number; name: string } | null;
    phase: { id: number; name: string } | null;
}

export default function TasksKanban({
    project,
    tasks,
    canCreate,
}: {
    project: { id: number; name: string; tasks_count: number; phases_count: number };
    tasks: Task[];
    canCreate?: boolean;
}) {
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [progressTaskId, setProgressTaskId] = useState<number | null>(null);

    const userRole = usePage<{ auth: { user: { role: string } } }>().props.auth.user.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin_vendor';
    const canUpdateProgress = isAdmin || userRole === 'project_manager' || userRole === 'team' || userRole === 'sub_vendor';

    const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status).sort((a, b) => a.sort_order - b.sort_order);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const taskId = parseInt(result.draggableId);
        const newStatus = result.destination.droppableId;

        router.post(
            route('projects.tasks.update-status', project.id),
            {
                id: taskId,
                status: newStatus,
            },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Kanban - ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={route('projects.tasks.index', project.id)}>
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <p className="text-muted-foreground text-sm">{tasks.length} tasks</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')}>
                            {view === 'kanban' ? <List className="mr-1 h-3 w-3" /> : <LayoutGrid className="mr-1 h-3 w-3" />}
                            {view === 'kanban' ? 'List View' : 'Kanban View'}
                        </Button>
                        {canCreate && (
                            <Link href={route('projects.tasks.create', project.id)}>
                                <Button size="sm">
                                    <Plus className="mr-1 h-3 w-3" />
                                    New Task
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {!isAdmin && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Drag-kanvan hanya untuk admin. Klik tombol Update Progress pada card untuk update status dengan foto bukti.
                    </div>
                )}

                <DragDropContext onDragEnd={isAdmin ? onDragEnd : () => undefined}>
                    <div className="grid flex-1 gap-4 lg:grid-cols-5">
                        {columns.map((col) => {
                            const columnTasks = getTasksByStatus(col.id);
                            return (
                                <div key={col.id} className="bg-muted/20 flex flex-col rounded-lg border">
                                    <div className="flex items-center justify-between border-b px-3 py-2">
                                        <span className="text-sm font-medium">{col.title}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {columnTasks.length}
                                        </Badge>
                                    </div>
                                    <Droppable droppableId={col.id} isDropDisabled={!isAdmin}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`min-h-[200px] flex-1 space-y-2 p-2 transition-colors ${
                                                    snapshot.isDraggingOver ? 'bg-accent/30' : ''
                                                }`}
                                            >
                                                {columnTasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={!isAdmin}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...(isAdmin ? provided.dragHandleProps : {})}
                                                                className={`bg-background rounded-lg border p-3 text-sm transition-shadow ${
                                                                    snapshot.isDragging ? 'ring-primary shadow-lg ring-2' : ''
                                                                }`}
                                                            >
                                                                <div className="mb-1 flex items-start justify-between gap-1">
                                                                    <Link
                                                                        href={route('projects.tasks.show', [project.id, task.id])}
                                                                        className="block font-medium hover:underline"
                                                                    >
                                                                        {task.name}
                                                                    </Link>
                                                                    <div className="flex shrink-0 items-center gap-1">
                                                                        {canUpdateProgress && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setProgressTaskId(task.id)}
                                                                                className="text-muted-foreground hover:text-foreground"
                                                                                title="Update Progress"
                                                                            >
                                                                                <TrendingUp className="h-3 w-3" />
                                                                            </button>
                                                                        )}
                                                                        {!isAdmin && (
                                                                            <Link
                                                                                href={route('projects.tasks.edit', [project.id, task.id])}
                                                                                className="text-muted-foreground hover:text-foreground"
                                                                                title="Edit task"
                                                                            >
                                                                                <Pencil className="h-3 w-3" />
                                                                            </Link>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant={
                                                                            statusColors[task.status] as
                                                                                | 'default'
                                                                                | 'secondary'
                                                                                | 'destructive'
                                                                                | 'outline'
                                                                                | 'warning'
                                                                                | 'success'
                                                                        }
                                                                        className="text-[10px]"
                                                                    >
                                                                        {task.status.replace('_', ' ')}
                                                                    </Badge>
                                                                    <Badge
                                                                        variant={
                                                                            priorityColors[task.priority] as
                                                                                | 'default'
                                                                                | 'secondary'
                                                                                | 'destructive'
                                                                                | 'outline'
                                                                                | 'warning'
                                                                                | 'success'
                                                                        }
                                                                        className="text-[10px]"
                                                                    >
                                                                        {task.priority}
                                                                    </Badge>
                                                                    {task.phase && (
                                                                        <span className="text-muted-foreground text-[10px]">{task.phase.name}</span>
                                                                    )}
                                                                </div>
                                                                {task.assigned_user && (
                                                                    <p className="text-muted-foreground mt-1 text-[10px]">
                                                                        {task.assigned_user.name}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {progressTaskId !== null &&
                (() => {
                    const t = tasks.find((x) => x.id === progressTaskId);
                    if (!t) return null;
                    return (
                        <UpdateProgressModal
                            open={true}
                            onClose={() => setProgressTaskId(null)}
                            type="task"
                            projectId={project.id}
                            taskId={t.id}
                            currentStatus={t.status as 'not_started' | 'in_progress' | 'review' | 'done' | 'revisi'}
                            isAdmin={isAdmin}
                        />
                    );
                })()}
        </AppLayout>
    );
}
