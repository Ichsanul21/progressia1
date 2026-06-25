import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CheckSquare, Eye, GanttChart, Layers, LayoutGrid, Pencil, Plus, Search, Trash2, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';

import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UpdateProgressModal from '@/components/update-progress-modal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Tasks', href: '' },
];

interface Task {
    id: number;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    progress: number;
    assigned_user: { id: number; name: string } | null;
    created_at: string;
}

const statusColors: Record<string, string> = {
    not_started: 'secondary',
    in_progress: 'default',
    review: 'warning',
    done: 'success',
    revisi: 'destructive',
};

const priorityColors: Record<string, string> = {
    low: 'secondary',
    medium: 'default',
    high: 'warning',
    urgent: 'destructive',
};

export default function TasksIndex({
    project,
    tasks,
    phases,
    filters,
    members,
    canCreate,
    canUpdate,
    canDelete,
}: {
    project: { id: number; name: string; tasks_count: number; phases_count: number };
    tasks: {
        data: Task[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    phases: { id: number; name: string }[];
    filters: { status?: string; priority?: string; phase_id?: string; search?: string };
    members?: { id: number; name: string }[];
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
}) {
    const currentPhase = phases.find((p) => String(p.id) === filters.phase_id);
    const userRole = usePage<{ auth: { user: { role: string } } }>().props.auth.user.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin_vendor';
    const canUpdateProgress = isAdmin || userRole === 'project_manager' || userRole === 'team' || userRole === 'sub_vendor';
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [batchStatus, setBatchStatus] = useState<string>('');
    const [batchAssign, setBatchAssign] = useState<string>('');
    const [showBatchAssign, setShowBatchAssign] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const [progressTaskId, setProgressTaskId] = useState<number | null>(null);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const updated: { status?: string; priority?: string; phase_id?: string; search?: string } = { ...filters, search: search || undefined };
        if (!search) delete updated.search;
        router.get(route('projects.tasks.index', project.id), updated, { preserveState: true });
    };

    const [confirmDelete, setConfirmDelete] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });

    const askConfirm = (title: string, description: string, onConfirm: () => void) => {
        setConfirmDelete({ open: true, title, description, onConfirm });
    };

    const handleFilter = (key: string, value: string) => {
        const updated = { ...filters, [key]: value };
        if (!value) delete updated[key as keyof typeof updated];
        router.get(route('projects.tasks.index', project.id), updated, { preserveState: true });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === tasks.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(tasks.data.map((t) => t.id));
        }
    };

    const handleBatchStatus = () => {
        if (!batchStatus || selectedIds.length === 0) return;
        router.post(
            route('projects.tasks.batch.status', project.id),
            {
                task_ids: selectedIds,
                status: batchStatus,
            },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setBatchStatus('');
                },
            },
        );
    };

    const handleBatchAssign = () => {
        if (!batchAssign || selectedIds.length === 0) return;
        router.post(
            route('projects.tasks.batch.assign', project.id),
            {
                task_ids: selectedIds,
                assigned_to: batchAssign === 'unassign' ? '' : batchAssign,
            },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setBatchAssign('');
                    setShowBatchAssign(false);
                },
            },
        );
    };

    const handleBatchDelete = () => {
        if (selectedIds.length === 0) return;
        askConfirm('Hapus Tugas', `Yakin ingin menghapus ${selectedIds.length} tugas yang dipilih? Tindakan ini tidak dapat dibatalkan.`, () =>
            router.post(
                route('projects.tasks.batch.destroy', project.id),
                {
                    task_ids: selectedIds,
                },
                { onSuccess: () => setSelectedIds([]) },
            ),
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tasks - ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={route('projects.show', project.id)}>
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <p className="text-muted-foreground text-sm">
                            {currentPhase ? (
                                <span className="flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    Phase: {currentPhase.name} &middot;
                                </span>
                            ) : null}{' '}
                            {project.tasks_count} tasks
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('projects.tasks.kanban', project.id)}>
                            <Button variant="outline" size="sm">
                                <LayoutGrid className="mr-1 h-4 w-4" />
                                Kanban
                            </Button>
                        </Link>
                        <Link href={route('projects.tasks.gantt', project.id)}>
                            <Button variant="outline" size="sm">
                                <GanttChart className="mr-1 h-4 w-4" />
                                Gantt
                            </Button>
                        </Link>
                        <Link href={route('projects.calendar', project.id)}>
                            <Button variant="outline" size="sm">
                                <CalendarDays className="mr-1 h-4 w-4" />
                                Calendar
                            </Button>
                        </Link>
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

                <div className="flex flex-wrap items-center gap-2">
                    {phases.length > 0 && (
                        <>
                            <Button variant={!filters.phase_id ? 'default' : 'outline'} size="sm" onClick={() => handleFilter('phase_id', '')}>
                                All Phases
                            </Button>
                            {phases.map((p) => (
                                <Button
                                    key={p.id}
                                    variant={filters.phase_id === String(p.id) ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleFilter('phase_id', String(p.id))}
                                >
                                    <Layers className="mr-1 h-3 w-3" />
                                    {p.name}
                                </Button>
                            ))}
                        </>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {['', 'not_started', 'in_progress', 'review', 'done', 'revisi'].map((s) => (
                        <Button key={s} variant={filters.status === s ? 'default' : 'outline'} size="sm" onClick={() => handleFilter('status', s)}>
                            {s ? s.replace('_', ' ') : 'All'}
                        </Button>
                    ))}
                </div>

                <form onSubmit={submitSearch} className="flex items-center gap-2">
                    <Input placeholder="Cari task..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    <Button variant="outline" size="sm" type="submit" aria-label="Cari task">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                {!isAdmin && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Klik tombol Update Progress untuk update status dengan foto bukti. Drag-kanvan dan batch actions hanya untuk admin.
                    </div>
                )}

                {isAdmin && selectedIds.length > 0 && (
                    <div className="bg-accent/30 flex flex-wrap items-center gap-2 rounded-lg border p-3">
                        <CheckSquare className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">{selectedIds.length} selected</span>

                        <Select value={batchStatus} onValueChange={setBatchStatus}>
                            <SelectTrigger className="h-8 w-40">
                                <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="not_started">Not Started</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="review">Review</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="default" size="sm" onClick={handleBatchStatus} disabled={!batchStatus}>
                            Apply
                        </Button>

                        {showBatchAssign && members ? (
                            <div className="flex items-center gap-2">
                                <Select value={batchAssign} onValueChange={setBatchAssign}>
                                    <SelectTrigger className="h-8 w-40">
                                        <SelectValue placeholder="Assign to" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassign">Unassign</SelectItem>
                                        {members.map((m) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="default" size="sm" onClick={handleBatchAssign} disabled={!batchAssign}>
                                    Assign
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setShowBatchAssign(false)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setShowBatchAssign(true)}>
                                Assign
                            </Button>
                        )}

                        {canDelete && (
                            <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                                <Trash2 className="mr-1 h-3 w-3" />
                                Delete
                            </Button>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                            Clear
                        </Button>
                    </div>
                )}

                {isAdmin && (
                    <div className="flex items-center gap-2 px-1">
                        <Checkbox checked={tasks.data.length > 0 && selectedIds.length === tasks.data.length} onCheckedChange={toggleSelectAll} />
                        <span className="text-muted-foreground text-xs">
                            {selectedIds.length > 0 ? `${selectedIds.length} of ${tasks.data.length} selected` : 'Select all'}
                        </span>
                    </div>
                )}

                <div className="space-y-3">
                    {tasks.data.map((task) => (
                        <Card key={task.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {isAdmin && (
                                            <Checkbox checked={selectedIds.includes(task.id)} onCheckedChange={() => toggleSelect(task.id)} />
                                        )}
                                        <Link href={route('projects.tasks.show', [project.id, task.id])} className="hover:underline">
                                            <CardTitle className="text-base">{task.name}</CardTitle>
                                        </Link>
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
                                        >
                                            {task.priority}
                                        </Badge>
                                    </div>
                                    <Badge
                                        variant={
                                            statusColors[task.status] as 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'
                                        }
                                    >
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground line-clamp-1 text-sm">{task.description ?? 'No description'}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">{task.progress}%</span>
                                    </div>
                                    <div className="bg-secondary mt-1 h-2 w-full rounded-full">
                                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link href={route('projects.tasks.show', [project.id, task.id])}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="mr-1 h-3 w-3" />
                                            View
                                        </Button>
                                    </Link>
                                    {canUpdateProgress && (
                                        <Button variant="default" size="sm" onClick={() => setProgressTaskId(task.id)}>
                                            <TrendingUp className="mr-1 h-3 w-3" />
                                            Update Progress
                                        </Button>
                                    )}
                                    {canUpdate && (
                                        <Link href={route('projects.tasks.edit', [project.id, task.id])}>
                                            <Button variant="outline" size="sm">
                                                <Pencil className="mr-1 h-3 w-3" />
                                                Edit
                                            </Button>
                                        </Link>
                                    )}
                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                askConfirm('Hapus Tugas', `Yakin ingin menghapus tugas "${task.name}"?`, () =>
                                                    router.delete(route('projects.tasks.destroy', [project.id, task.id])),
                                                )
                                            }
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Pagination pagination={tasks} />

                    {tasks.data.length === 0 && (
                        <div className="text-muted-foreground py-12 text-center">
                            <p>No tasks found.</p>
                            {canCreate && (
                                <Link href={route('projects.tasks.create', project.id)} className="mt-2 inline-block text-sm underline">
                                    Create your first task
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={confirmDelete.open}
                onOpenChange={(open) => setConfirmDelete((p) => ({ ...p, open }))}
                onConfirm={() => {
                    confirmDelete.onConfirm();
                    setConfirmDelete((p) => ({ ...p, open: false }));
                }}
                title={confirmDelete.title}
                description={confirmDelete.description}
            />

            {progressTaskId !== null &&
                (() => {
                    const t = tasks.data.find((x) => x.id === progressTaskId);
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
