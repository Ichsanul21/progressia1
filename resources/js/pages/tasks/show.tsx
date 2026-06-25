import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Camera, Download, History, MessageSquare, Paperclip, Pencil, RefreshCw, Send, Trash2, TrendingUp, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import ConfirmDialog from '@/components/confirm-dialog';
import { type TimelineEntry } from '@/components/history-entry';
import SubTaskTree, { type SubTaskData } from '@/components/sub-task-tree';
import TaskHistory from '@/components/task-history';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UpdateProgressModal from '@/components/update-progress-modal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

function buildInitialEntries(task: TaskData): TimelineEntry[] {
    const entries: TimelineEntry[] = [];

    (task.progress_updates ?? []).forEach((u) => {
        entries.push({
            id: `progress-task-${u.id}`,
            type: 'progress',
            subject: 'task',
            subject_id: task.id,
            subject_name: task.name,
            description: u.description,
            user: u.created_by,
            created_at: u.created_at,
            photos: u.photos.map((p) => ({ id: p.id, path: p.url.replace(/^\/storage\//, '') })),
        });
    });

    (task.sub_tasks ?? []).forEach((st) => {
        (st.progress_updates ?? []).forEach((u) => {
            entries.push({
                id: `progress-sub-${u.id}`,
                type: 'progress',
                subject: 'sub_task',
                subject_id: st.id,
                subject_name: st.name,
                description: u.description,
                user: u.created_by,
                created_at: u.created_at,
                photos: u.photos.map((p) => ({ id: p.id, path: p.url.replace(/^\/storage\//, '') })),
            });
        });
    });

    return entries.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 50);
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Tasks', href: '' },
    { title: 'Detail', href: '' },
];

interface SubTaskLog {
    id: number;
    event: string;
    description: string;
    created_at: string;
    user: { id: number; name: string } | null;
}

interface SubTaskProgressUpdate {
    id: number;
    description: string;
    created_at: string;
    created_by: { id: number; name: string };
    photos: { id: number; url: string }[];
}

interface SubTaskWithHistory extends SubTaskData {
    activity_logs?: SubTaskLog[];
    progress_updates?: SubTaskProgressUpdate[];
}

interface ProgressPhoto {
    id: number;
    url: string;
}

interface ProgressUpdate {
    id: number;
    description: string;
    created_at: string;
    created_by: { id: number; name: string };
    photos: ProgressPhoto[];
}

interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: { id: number; name: string };
}

interface Attachment {
    id: number;
    filename: string;
    original_filename: string;
    mime_type: string | null;
    size: number | null;
    size_for_humans: string;
    url: string;
    created_at: string;
    uploader: { id: number; name: string } | null;
}

interface TaskData {
    id: number;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    progress: number;
    assigned_user: { id: number; name: string } | null;
    phase: { id: number; name: string } | null;
    sub_tasks: SubTaskWithHistory[];
    start_date: string | null;
    due_date: string | null;
    progress_updates: ProgressUpdate[];
    comments: Comment[];
    attachments: Attachment[];
    is_recurring: boolean;
    recurrence_frequency: string | null;
    recurrence_interval: number | null;
    recurrence_end_date: string | null;
    recurrence_days: string[] | null;
    has_pending_approval: boolean;
    updater: { id: number; name: string } | null;
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

export default function TasksShow({
    project,
    task,
    members,
    can = { delete: false, update: false },
}: {
    project: { id: number; name: string };
    task: TaskData;
    members: { id: number; name: string }[];
    can?: { delete?: boolean; update?: boolean; create?: boolean };
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [showUpdateProgress, setShowUpdateProgress] = useState(false);
    const userRole = usePage<SharedData>().props.auth.user.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin_vendor';
    const isClient = userRole === 'client';
    const canUpdateProgress = isAdmin || userRole === 'project_manager' || userRole === 'team' || userRole === 'sub_vendor';

    const [confirmDelete, setConfirmDelete] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });

    const askConfirm = (title: string, description: string, onConfirm: () => void) => {
        setConfirmDelete({ open: true, title, description, onConfirm });
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        router.post(route('task-attachments.store', [project.id, task.id]), formData, {
            preserveScroll: true,
            onFinish: () => {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleDeleteAttachment = (attachment: Attachment) => {
        askConfirm('Hapus Lampiran', `Yakin ingin menghapus lampiran "${attachment.original_filename}"?`, () =>
            router.delete(route('task-attachments.destroy', [project.id, task.id, attachment.id]), { preserveScroll: true }),
        );
    };

    const handleDelete = () => {
        askConfirm('Hapus Tugas', `Yakin ingin menghapus tugas "${task.name}"? Tindakan ini tidak dapat dibatalkan.`, () =>
            router.delete(route('projects.tasks.destroy', [project.id, task.id])),
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={task.name} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={isClient ? route('projects.show', project.id) : route('projects.tasks.index', project.id)}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        {canUpdateProgress && (
                            <Button variant="default" size="sm" onClick={() => setShowUpdateProgress(true)}>
                                <TrendingUp className="mr-1 h-3 w-3" />
                                Update Progress
                            </Button>
                        )}
                        {can.update && (
                            <Link href={route('projects.tasks.edit', [project.id, task.id])}>
                                <Button variant="outline" size="sm">
                                    <Pencil className="mr-1 h-3 w-3" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {can.delete && (
                            <Button variant="destructive" size="sm" onClick={handleDelete}>
                                <Trash2 className="mr-1 h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{task.name}</CardTitle>
                                        <p className="text-muted-foreground text-sm">{task.assigned_user?.name ?? 'Unassigned'}</p>
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
                                        >
                                            {task.status.replace('_', ' ')}
                                        </Badge>
                                        {task.has_pending_approval && (
                                            <Badge variant="warning" className="animate-pulse">
                                                Pending Approval
                                            </Badge>
                                        )}
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
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-bold">{task.progress}%</span>
                                    </div>
                                    <div className="bg-secondary mt-1 h-3 w-full rounded-full">
                                        <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                                    </div>
                                </div>
                                {task.description && <p className="text-muted-foreground text-sm whitespace-pre-wrap">{task.description}</p>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Sub-Tasks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SubTaskTree
                                    subTasks={task.sub_tasks}
                                    projectId={project.id}
                                    taskId={task.id}
                                    members={members}
                                    canDelete={can.update}
                                    canCreate={can.create}
                                />
                                {task.sub_tasks?.length === 0 && <p className="text-muted-foreground py-4 text-center text-sm">No sub-tasks yet.</p>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Paperclip className="h-4 w-4" />
                                    Attachments ({task.attachments?.length ?? 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {task.attachments && task.attachments.length > 0 ? (
                                        task.attachments.map((att) => (
                                            <div key={att.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <Paperclip className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                    <a
                                                        href={att.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="truncate hover:underline"
                                                        download
                                                    >
                                                        {att.original_filename}
                                                    </a>
                                                    <span className="text-muted-foreground shrink-0 text-xs">({att.size_for_humans})</span>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    <Link href={route('task-attachments.download', [project.id, task.id, att.id])}>
                                                        <Button variant="ghost" size="sm">
                                                            <Download className="h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                    {can.update && (
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(att)}>
                                                            <Trash2 className="text-destructive h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground py-2 text-center text-sm">No attachments.</p>
                                    )}

                                    <div className="pt-2">
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                                        {can.update && (
                                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                                <Upload className="mr-1 h-3 w-3" />
                                                {uploading ? 'Uploading...' : 'Upload File'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MessageSquare className="h-4 w-4" />
                                    Comments ({task.comments?.length ?? 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {can.update && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.target as HTMLFormElement;
                                            const content = new FormData(form).get('content') as string;
                                            if (!content?.trim()) return;
                                            router.post(
                                                route('task-comments.store', [project.id, task.id]),
                                                {
                                                    content,
                                                },
                                                { preserveScroll: true, onSuccess: () => form.reset() },
                                            );
                                        }}
                                        className="mb-4 flex gap-2"
                                    >
                                        <input
                                            name="content"
                                            placeholder="Write a comment... Use @name to mention someone"
                                            className="border-input bg-background focus-visible:ring-ring h-9 flex-1 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                        />
                                        <Button type="submit" size="sm">
                                            <Send className="h-3.5 w-3.5" />
                                        </Button>
                                    </form>
                                )}
                                <div className="max-h-80 space-y-3 overflow-y-auto">
                                    {(!task.comments || task.comments.length === 0) && (
                                        <p className="text-muted-foreground py-4 text-center text-sm">No comments yet.</p>
                                    )}
                                    {task.comments?.map((comment) => (
                                        <div key={comment.id} className="rounded-lg border p-3 text-sm">
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="font-medium">{comment.user.name}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    {new Date(comment.created_at).toLocaleDateString('id-ID', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Camera className="h-4 w-4" />
                                    Progress Documentation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!task.progress_updates || task.progress_updates.length === 0 ? (
                                    <p className="text-muted-foreground py-4 text-center text-sm">No progress documentation yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {task.progress_updates.map((update) => (
                                            <div key={update.id} className="rounded-lg border p-3">
                                                <div className="mb-2 flex items-start justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium">{update.created_by.name}</p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {new Date(update.created_at).toLocaleDateString('id-ID', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mb-2 text-sm whitespace-pre-wrap">{update.description}</p>
                                                {update.photos.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {update.photos.map((photo) => (
                                                            <a
                                                                key={photo.id}
                                                                href={photo.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block h-20 w-20 overflow-hidden rounded-lg border transition-opacity hover:opacity-80"
                                                            >
                                                                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <History className="h-4 w-4" />
                                    History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TaskHistory
                                    projectId={project.id}
                                    taskId={task.id}
                                    initialEntries={buildInitialEntries(task)}
                                    initialHasMore={false}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Project</span>
                                    <Link href={route('projects.show', project.id)} className="hover:underline">
                                        {project.name}
                                    </Link>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phase</span>
                                    <span>{task.phase?.name ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Assigned to</span>
                                    <span>{task.assigned_user?.name ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Priority</span>
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
                                        className="text-xs"
                                    >
                                        {task.priority}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge
                                        variant={
                                            statusColors[task.status] as 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'
                                        }
                                        className="text-xs"
                                    >
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Start</span>
                                    <span>{task.start_date ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Due</span>
                                    <span>{task.due_date ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last updated by</span>
                                    <span>{task.updater?.name ?? '—'}</span>
                                </div>
                                {task.is_recurring && (
                                    <>
                                        <div className="mt-2 border-t pt-2">
                                            <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium">
                                                <RefreshCw className="h-3 w-3" /> Recurring
                                            </p>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Frequency</span>
                                                <span className="capitalize">{task.recurrence_frequency}</span>
                                            </div>
                                            {task.recurrence_interval && task.recurrence_interval > 1 && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Every</span>
                                                    <span>{task.recurrence_interval} intervals</span>
                                                </div>
                                            )}
                                            {task.recurrence_end_date && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Until</span>
                                                    <span>{task.recurrence_end_date}</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
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

            <UpdateProgressModal
                open={showUpdateProgress}
                onClose={() => setShowUpdateProgress(false)}
                type="task"
                projectId={project.id}
                taskId={task.id}
                currentStatus={task.status as 'not_started' | 'in_progress' | 'review' | 'done' | 'revisi'}
                isAdmin={isAdmin}
            />
        </AppLayout>
    );
}
