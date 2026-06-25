import ConfirmDialog from '@/components/confirm-dialog';
import HistoryEntry, { type TimelineEntry } from '@/components/history-entry';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Camera, CheckCircle2, ChevronRight, Circle, History, LoaderCircle, Plus, Trash2, User, X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

export interface SubTaskData {
    id: number;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    sort_order: number;
    children?: SubTaskData[];
    parent_id?: number | null;
    assigned_to?: number | null;
    assigned_user?: { id: number; name: string } | null;
    progress_updates?: {
        id: number;
        description: string;
        created_by: { id: number; name: string };
        created_at: string;
        photos: { id: number; url: string }[];
    }[];
    activity_logs?: {
        id: number;
        event: string;
        description: string;
        user: { id: number; name: string } | null;
        created_at: string;
        old_values?: Record<string, unknown> | null;
        new_values?: Record<string, unknown> | null;
    }[];
}

export const SUB_TASK_STATUSES = ['not_started', 'in_progress', 'review', 'done', 'revisi'] as const;
export type SubTaskStatus = (typeof SUB_TASK_STATUSES)[number];

export const SUB_TASK_STATUS_LABELS: Record<SubTaskStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
    revisi: 'Revisi',
};

export const SUB_TASK_STATUS_COLORS: Record<SubTaskStatus, string> = {
    not_started: 'secondary',
    in_progress: 'default',
    review: 'warning',
    done: 'success',
    revisi: 'destructive',
};

export const SUB_TASK_STATUS_TRANSITIONS: Record<SubTaskStatus, SubTaskStatus[]> = {
    not_started: ['in_progress'],
    in_progress: ['review'],
    review: ['done', 'revisi'],
    revisi: ['review'],
    done: [],
};

interface Member {
    id: number;
    name: string;
}

export default function SubTaskTree({
    subTasks,
    projectId,
    taskId,
    members = [],
    depth = 0,
    canDelete = false,
    canCreate = false,
}: {
    subTasks: SubTaskData[];
    projectId: number;
    taskId: number;
    members?: Member[];
    depth?: number;
    canDelete?: boolean;
    canCreate?: boolean;
}) {
    const [addingTo, setAddingTo] = useState<number | null>(null);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newAssignedTo, setNewAssignedTo] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [progressModal, setProgressModal] = useState<SubTaskData | null>(null);
    const [deleting, setDeleting] = useState<SubTaskData | null>(null);
    const [administrativeUpdate, setAdministrativeUpdate] = useState(false);
    const [historyExpanded, setHistoryExpanded] = useState<Set<number>>(new Set());
    const [progressFormStatus, setProgressFormStatus] = useState<SubTaskStatus>('not_started');
    const [progressFormDescription, setProgressFormDescription] = useState('');
    const [progressFormAssignedTo, setProgressFormAssignedTo] = useState<string>('');
    const [progressPhotoFiles, setProgressPhotoFiles] = useState<File[]>([]);
    const [progressPhotoPreviews, setProgressPhotoPreviews] = useState<string[]>([]);
    const [progressServerErrors, setProgressServerErrors] = useState<Record<string, string>>({});
    const [progressProcessing, setProgressProcessing] = useState(false);
    const progressFormRef = useRef<HTMLFormElement>(null);

    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin_vendor';
    const isClient = userRole === 'client';

    const SUBTASK_PHOTO_MIN = 3;
    const SUBTASK_PHOTO_MAX = 10;
    const photosRequired = !(isAdmin && administrativeUpdate);

    const openProgressModal = (subTask: SubTaskData) => {
        setProgressModal(subTask);
        setAdministrativeUpdate(false);
        setProgressPhotoPreviews([]);
        setProgressServerErrors({});
        const validNext = (SUB_TASK_STATUS_TRANSITIONS[subTask.status as SubTaskStatus] ?? []).filter((s) => s !== subTask.status);
        const defaultNext = validNext[0] ?? subTask.status;
        setProgressFormStatus(defaultNext as SubTaskStatus);
        setProgressFormDescription('');
        setProgressFormAssignedTo(subTask.assigned_to?.toString() ?? '');
    };

    const closeProgressModal = () => {
        setProgressModal(null);
        setAdministrativeUpdate(false);
        setProgressPhotoFiles([]);
        setProgressPhotoPreviews([]);
        setProgressServerErrors({});
        setProgressProcessing(false);
    };

    const submitProgress: FormEventHandler = (e) => {
        e.preventDefault();
        if (!progressModal || !progressFormRef.current) return;

        const formData = new FormData(progressFormRef.current);
        formData.delete('photos[]');
        progressPhotoFiles.forEach((f) => formData.append('photos[]', f));
        formData.append('_method', 'PUT');
        if (progressFormAssignedTo !== (progressModal.assigned_to?.toString() ?? '')) {
            formData.set('assigned_to', progressFormAssignedTo);
        }

        setProgressProcessing(true);
        router.post(route('sub-tasks.update-progress', [projectId, taskId, progressModal.id]), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setProgressProcessing(false);
                closeProgressModal();
            },
            onError: (errors) => {
                setProgressProcessing(false);
                setProgressServerErrors(errors as Record<string, string>);
            },
            onFinish: () => setProgressProcessing(false),
        });
    };

    const updateAssignment = (subTask: SubTaskData, assignedTo: string) => {
        if (!isAdmin) return;
        router.put(
            route('sub-tasks.update', [projectId, taskId, subTask.id]),
            { assigned_to: assignedTo ? Number(assignedTo) : null, administrative_update: true },
            { preserveScroll: true },
        );
    };

    const handleConfirmDelete = () => {
        if (!deleting) return;
        router.delete(route('sub-tasks.destroy', [projectId, taskId, deleting.id]), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const addChild = (parentId: number | null) => {
        if (!newName.trim()) return;
        setLoading(true);
        const data: Record<string, string | number> = { name: newName };
        if (newDescription) data.description = newDescription;
        if (newAssignedTo) data.assigned_to = Number(newAssignedTo);
        if (parentId) data.parent_id = parentId;

        router.post(route('sub-tasks.store', [projectId, taskId]), data, {
            preserveScroll: true,
            onSuccess: () => {
                setNewName('');
                setNewDescription('');
                setNewAssignedTo('');
                setAddingTo(null);
                setLoading(false);
            },
            onError: () => setLoading(false),
            onFinish: () => setLoading(false),
        });
    };

    const hasChildren = (subTask: SubTaskData) => subTask.children && subTask.children.length > 0;

    const toggleHistory = (subTaskId: number) => {
        setHistoryExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(subTaskId)) {
                next.delete(subTaskId);
            } else {
                next.add(subTaskId);
            }
            return next;
        });
    };

    const buildSubTaskEntries = (subTask: SubTaskData): TimelineEntry[] => {
        const entries: TimelineEntry[] = [];

        (subTask.progress_updates ?? []).forEach((u) => {
            entries.push({
                id: `progress-sub-${u.id}`,
                type: 'progress',
                subject: 'sub_task',
                subject_id: subTask.id,
                subject_name: subTask.name,
                description: u.description,
                user: u.created_by,
                created_at: u.created_at,
                photos: u.photos.map((p) => ({ id: p.id, path: p.url.replace(/^\/storage\//, '') })),
            });
        });

        (subTask.activity_logs ?? []).forEach((log) => {
            entries.push({
                id: `activity-${log.id}`,
                type: 'activity',
                event: log.event,
                description: log.description,
                user: log.user,
                created_at: log.created_at,
                old_values: log.old_values ?? null,
                new_values: log.new_values ?? null,
                photos: [],
            });
        });

        return entries.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    };

    return (
        <>
            <div className="space-y-1" style={{ marginLeft: depth > 0 ? 24 : 0 }}>
                {subTasks.map((subTask) => (
                    <div key={subTask.id}>
                        <div className="group hover:bg-accent/50 flex items-center gap-2 rounded-lg border p-2.5 transition-colors">
                            <div className="flex w-5 shrink-0 items-center justify-center">
                                {hasChildren(subTask) ? (
                                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (isClient) return;
                                            openProgressModal(subTask);
                                        }}
                                        disabled={isClient}
                                        className="focus:outline-none disabled:cursor-default"
                                    >
                                        {subTask.status === 'done' ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : subTask.status === 'revisi' ? (
                                            <Circle className="h-5 w-5 text-red-500" />
                                        ) : (
                                            <Circle className="text-muted-foreground hover:text-foreground h-5 w-5" />
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-medium">{subTask.name}</span>
                                    <Badge
                                        variant={
                                            SUB_TASK_STATUS_COLORS[subTask.status as SubTaskStatus] as
                                                | 'default'
                                                | 'secondary'
                                                | 'destructive'
                                                | 'outline'
                                                | 'warning'
                                                | 'success'
                                        }
                                        className="text-[10px]"
                                    >
                                        {SUB_TASK_STATUS_LABELS[subTask.status as SubTaskStatus] ?? subTask.status}
                                    </Badge>
                                    {subTask.description && (
                                        <span className="text-muted-foreground max-w-[200px] truncate text-xs">{subTask.description}</span>
                                    )}
                                    {subTask.progress !== null && subTask.progress !== undefined && (
                                        <span className="text-muted-foreground shrink-0 text-xs">({subTask.progress}%)</span>
                                    )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2">
                                    {members.length > 0 && isAdmin && (
                                        <select
                                            value={subTask.assigned_to ?? ''}
                                            onChange={(e) => updateAssignment(subTask, e.target.value)}
                                            className="border-input text-muted-foreground hover:text-foreground focus:ring-ring h-6 rounded border bg-transparent px-1.5 text-xs focus:ring-1 focus:outline-none"
                                            title="Assign to (admin only)"
                                        >
                                            <option value="">Unassigned</option>
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {subTask.assigned_user && (!members.length || !isAdmin) && (
                                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                            <User className="h-3 w-3" />
                                            {subTask.assigned_user.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleHistory(subTask.id)} title="History">
                                    <History className="h-3.5 w-3.5" />
                                </Button>
                                {canCreate && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => {
                                            setAddingTo(addingTo === subTask.id ? null : subTask.id);
                                            setNewName('');
                                            setNewAssignedTo('');
                                        }}
                                        title="Add sub-task"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive h-7 w-7 p-0"
                                    onClick={() => setDeleting(subTask)}
                                    title="Delete"
                                    disabled={!canDelete}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {historyExpanded.has(subTask.id) && (
                            <div className="bg-muted/30 mt-1 mb-2 ml-9 space-y-3 rounded-lg border p-3">
                                {buildSubTaskEntries(subTask).length === 0 ? (
                                    <p className="text-muted-foreground py-2 text-center text-xs">Belum ada history untuk sub-tugas ini.</p>
                                ) : (
                                    buildSubTaskEntries(subTask).map((entry) => <HistoryEntry key={entry.id} entry={entry} />)
                                )}
                            </div>
                        )}

                        {subTask.progress_updates && subTask.progress_updates.length > 0 && (
                            <div className="mt-1 mb-2 ml-9 flex flex-wrap gap-2">
                                {subTask.progress_updates.map((update) => (
                                    <div key={update.id} className="flex flex-wrap gap-1">
                                        {update.photos.map((photo) => (
                                            <a
                                                key={photo.id}
                                                href={photo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block h-12 w-12 overflow-hidden rounded border"
                                            >
                                                <img src={photo.url} alt="progress" className="h-full w-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {addingTo === subTask.id && (
                            <div className="bg-muted/30 mt-1 mb-2 ml-7 flex items-end gap-2 rounded-lg border border-dashed p-2">
                                <div className="flex-1">
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Sub-task name"
                                        className="h-8 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addChild(subTask.id)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="Description"
                                        className="h-8 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addChild(subTask.id)}
                                    />
                                </div>
                                {members.length > 0 && (
                                    <div className="w-32">
                                        <Label className="text-xs">Assign To</Label>
                                        <select
                                            value={newAssignedTo}
                                            onChange={(e) => setNewAssignedTo(e.target.value)}
                                            className="border-input bg-background focus:ring-ring h-8 w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:outline-none"
                                        >
                                            <option value="">Unassigned</option>
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <Button size="sm" className="h-8" onClick={() => addChild(subTask.id)} disabled={loading || !newName.trim()}>
                                    {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        )}

                        {hasChildren(subTask) && (
                            <SubTaskTree
                                subTasks={subTask.children!}
                                projectId={projectId}
                                taskId={taskId}
                                members={members}
                                depth={depth + 1}
                                canDelete={canDelete}
                            />
                        )}
                    </div>
                ))}

                {depth === 0 && (
                    <div className="pt-2">
                        {canCreate && addingTo === null ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground w-full justify-start gap-2"
                                onClick={() => setAddingTo(0)}
                            >
                                <Plus className="h-4 w-4" />
                                Add sub-task
                            </Button>
                        ) : addingTo === 0 ? (
                            <div className="flex items-end gap-2 rounded-lg border border-dashed p-2">
                                <div className="flex-1">
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Sub-task name"
                                        className="h-8 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addChild(null)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="Description"
                                        className="h-8 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addChild(null)}
                                    />
                                </div>
                                {members.length > 0 && (
                                    <div className="w-32">
                                        <Label className="text-xs">Assign To</Label>
                                        <select
                                            value={newAssignedTo}
                                            onChange={(e) => setNewAssignedTo(e.target.value)}
                                            className="border-input bg-background focus:ring-ring h-8 w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:outline-none"
                                        >
                                            <option value="">Unassigned</option>
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <Button size="sm" className="h-8" onClick={() => addChild(null)} disabled={loading || !newName.trim()}>
                                    {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingTo(null)}>
                                    Cancel
                                </Button>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {progressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeProgressModal}>
                    <div className="bg-background w-full max-w-lg rounded-xl border p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Update Sub-Task Progress</h3>
                            <Button variant="ghost" size="sm" onClick={closeProgressModal}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <p className="text-muted-foreground mb-4 text-sm">
                            Sub-task: <strong>{progressModal.name}</strong> (saat ini:{' '}
                            {SUB_TASK_STATUS_LABELS[progressModal.status as SubTaskStatus] ?? progressModal.status})
                        </p>

                        <form ref={progressFormRef} onSubmit={submitProgress} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="progress-status">Status</Label>
                                <select
                                    id="progress-status"
                                    name="status"
                                    value={progressFormStatus}
                                    onChange={(e) => setProgressFormStatus(e.target.value as SubTaskStatus)}
                                    className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                                >
                                    <option value={progressModal.status}>
                                        {SUB_TASK_STATUS_LABELS[progressModal.status as SubTaskStatus]} (saat ini)
                                    </option>
                                    {(isAdmin
                                        ? SUB_TASK_STATUSES.filter((s) => s !== progressModal.status)
                                        : (SUB_TASK_STATUS_TRANSITIONS[progressModal.status as SubTaskStatus] ?? [])
                                    ).map((s) => (
                                        <option key={s} value={s}>
                                            {SUB_TASK_STATUS_LABELS[s]}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={progressServerErrors.status} />
                            </div>

                            {isAdmin && (
                                <label className="text-muted-foreground flex items-center gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        name="administrative_update"
                                        value="1"
                                        checked={administrativeUpdate}
                                        onChange={(e) => setAdministrativeUpdate(e.target.checked)}
                                        className="h-3.5 w-3.5"
                                    />
                                    Update administratif (lewati upload foto)
                                </label>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="progress-description">
                                    Description {progressFormStatus !== progressModal.status && <span className="text-destructive">*</span>}
                                </Label>
                                <textarea
                                    id="progress-description"
                                    name="progress_description"
                                    value={progressFormDescription}
                                    onChange={(e) => setProgressFormDescription(e.target.value)}
                                    className="border-input bg-background flex h-24 w-full rounded-md border px-3 py-2 text-sm"
                                    placeholder="Describe the progress made..."
                                />
                                <InputError message={progressServerErrors.progress_description} />
                            </div>

                            {members.length > 0 && isAdmin && (
                                <div className="grid gap-2">
                                    <Label htmlFor="progress-assigned-to">Assign To</Label>
                                    <select
                                        id="progress-assigned-to"
                                        name="assigned_to"
                                        value={progressFormAssignedTo}
                                        onChange={(e) => setProgressFormAssignedTo(e.target.value)}
                                        className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="">Unassigned</option>
                                        {members.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label>
                                    Photos {photosRequired && <span className="text-destructive">*</span>}
                                    {isAdmin && administrativeUpdate && <span className="text-muted-foreground text-xs">(opsional untuk admin)</span>}
                                </Label>
                                <Input
                                    name="photos[]"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        const merged = [...progressPhotoFiles, ...files].slice(0, SUBTASK_PHOTO_MAX);
                                        setProgressPhotoFiles(merged);
                                        setProgressPhotoPreviews(merged.map((f) => URL.createObjectURL(f)));
                                        e.target.value = '';
                                    }}
                                />
                                <InputError message={progressServerErrors.photos} />
                                <p
                                    className={`text-xs ${photosRequired && progressPhotoFiles.length < SUBTASK_PHOTO_MIN ? 'text-destructive' : 'text-muted-foreground'}`}
                                >
                                    {progressPhotoFiles.length < SUBTASK_PHOTO_MIN && photosRequired
                                        ? `Wajib upload minimal ${SUBTASK_PHOTO_MIN} foto, maksimal ${SUBTASK_PHOTO_MAX}.`
                                        : `${progressPhotoFiles.length} / ${SUBTASK_PHOTO_MAX} foto`}
                                </p>
                                {progressPhotoPreviews.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                        {progressPhotoPreviews.map((src, i) => (
                                            <div key={i} className="group relative h-20 overflow-hidden rounded border">
                                                <img src={src} alt="" className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProgressPhotoFiles((prev) => prev.filter((_, idx) => idx !== i));
                                                        setProgressPhotoPreviews((prev) => prev.filter((_, idx) => idx !== i));
                                                    }}
                                                    className="bg-destructive text-destructive-foreground absolute top-1 right-1 rounded-full p-0.5 opacity-0 transition group-hover:opacity-100"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {progressServerErrors['photos.0'] && <InputError message={progressServerErrors['photos.0']} />}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={progressProcessing || (photosRequired && progressPhotoFiles.length < SUBTASK_PHOTO_MIN)}
                                >
                                    {progressProcessing ? (
                                        <LoaderCircle className="mr-1 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Camera className="mr-1 h-4 w-4" />
                                    )}
                                    Submit Progress
                                </Button>
                                <Button variant="ghost" type="button" onClick={closeProgressModal}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Sub-Tugas"
                description={`Yakin ingin menghapus sub-tugas "${deleting?.name}"?`}
            />
        </>
    );
}
