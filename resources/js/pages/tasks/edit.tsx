import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Camera, LoaderCircle, X } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Tasks', href: '' },
    { title: 'Edit', href: '' },
];

interface Task {
    id: number;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    progress: number;
    assigned_to: number | null;
    assigned_user: { id: number; name: string } | null;
    sub_vendor_id: number | null;
    sub_vendor: { id: number; name: string } | null;
    start_date: string | null;
    due_date: string | null;
    phase_id: number | null;
    is_recurring: boolean;
    recurrence_frequency: string | null;
    recurrence_interval: number | null;
    recurrence_end_date: string | null;
    recurrence_days: string[] | null;
}

export default function TasksEdit({
    project,
    task,
    members,
    phases,
    subVendors = [],
    canChangeDates,
}: {
    project: { id: number; name: string };
    task: Task;
    members: { id: number; name: string }[];
    phases: { id: number; name: string }[];
    subVendors?: { id: number; name: string }[];
    canChangeDates?: boolean;
}) {
    const [photos, setPhotos] = useState<File[]>([]);
    const userRole = usePage<SharedData>().props.auth.user.role;
    const isAdmin = userRole === 'super_admin' || userRole === 'admin_vendor';
    const [administrativeUpdate, setAdministrativeUpdate] = useState(false);

    const TASK_PHOTO_MIN = 3;
    const TASK_PHOTO_MAX = 10;

    const { data, setData, put, processing, errors } = useForm({
        name: task.name,
        description: task.description ?? '',
        phase_id: task.phase_id?.toString() ?? '',
        status: task.status,
        priority: task.priority,
        progress: task.progress.toString(),
        assigned_to: task.assigned_to?.toString() ?? '',
        sub_vendor_id: task.sub_vendor_id?.toString() ?? '',
        start_date: task.start_date?.slice(0, 10) ?? '',
        due_date: task.due_date?.slice(0, 10) ?? '',
        progress_description: '',
        is_recurring: task.is_recurring ?? false,
        recurrence_frequency: task.recurrence_frequency ?? 'weekly',
        recurrence_interval: task.recurrence_interval ?? 1,
        recurrence_end_date: task.recurrence_end_date?.slice(0, 10) ?? '',
        administrative_update: false as boolean,
    });

    const initialValues = useMemo(
        () => ({
            name: task.name,
            description: task.description ?? '',
            phase_id: task.phase_id?.toString() ?? '',
            status: task.status,
            priority: task.priority,
            progress: task.progress.toString(),
            assigned_to: task.assigned_to?.toString() ?? '',
            sub_vendor_id: task.sub_vendor_id?.toString() ?? '',
            start_date: task.start_date?.slice(0, 10) ?? '',
            due_date: task.due_date?.slice(0, 10) ?? '',
            is_recurring: task.is_recurring ?? false,
            recurrence_frequency: task.recurrence_frequency ?? 'weekly',
            recurrence_interval: task.recurrence_interval ?? 1,
            recurrence_end_date: task.recurrence_end_date?.slice(0, 10) ?? '',
        }),
        [task],
    );

    const statusChanged = data.status !== task.status;
    const progressChanged = parseInt(data.progress) !== task.progress;
    const hasProgressChange = statusChanged || progressChanged;
    const photosRequired = hasProgressChange && !(isAdmin && administrativeUpdate);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const changes: Record<string, unknown> = {};
        for (const [key, initial] of Object.entries(initialValues)) {
            const current = data[key as keyof typeof data];
            if (current !== initial) {
                changes[key] = key === 'progress' ? parseInt(current as string) || 0 : current;
            }
        }
        if (data.progress_description && data.progress_description.trim() !== '') {
            changes.progress_description = data.progress_description;
        }
        if (photos.length > 0) {
            changes.photos = photos;
        }
        if (isAdmin && administrativeUpdate) {
            changes.administrative_update = true;
        }
        put(route('projects.tasks.update', [project.id, task.id]), {
            data: changes,
            forceFormData: true,
            onSuccess: () => setPhotos([]),
        });
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Task" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <Link href={route('projects.tasks.show', [project.id, task.id])}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                </div>
                <h1 className="text-2xl font-bold">Edit Task</h1>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">{task.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Task Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phase_id">Phase</Label>
                                <select
                                    id="phase_id"
                                    value={data.phase_id}
                                    onChange={(e) => setData('phase_id', e.target.value)}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <option value="">No phase</option>
                                    {phases.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.phase_id} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="done">Done</option>
                                        <option value="revisi">Revisi</option>
                                    </select>
                                    <InputError message={errors.status} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <select
                                        id="priority"
                                        value={data.priority}
                                        onChange={(e) => setData('priority', e.target.value)}
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    <InputError message={errors.priority} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="progress">Progress (%)</Label>
                                <Input
                                    id="progress"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={data.progress}
                                    onChange={(e) => setData('progress', e.target.value)}
                                />
                                <InputError message={errors.progress} />
                            </div>

                            {hasProgressChange && (
                                <div className="grid gap-2">
                                    <Label htmlFor="progress_description">
                                        Description <span className="text-destructive">*</span>
                                    </Label>
                                    <textarea
                                        id="progress_description"
                                        value={data.progress_description}
                                        onChange={(e) => setData('progress_description', e.target.value)}
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                        placeholder="Describe the progress update..."
                                    />
                                    <InputError message={errors.progress_description} />
                                </div>
                            )}

                            <div className="space-y-2 rounded-lg border p-4">
                                {isAdmin && (
                                    <label className="text-muted-foreground flex items-center gap-2 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={administrativeUpdate}
                                            onChange={(e) => {
                                                setAdministrativeUpdate(e.target.checked);
                                                setData('administrative_update', e.target.checked);
                                            }}
                                            className="h-3.5 w-3.5"
                                        />
                                        Update administratif (lewati upload foto, hanya untuk perubahan nama/deskripsi/tanggal)
                                    </label>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="task-photos" className="flex items-center gap-1.5">
                                        <Camera className="h-4 w-4" />
                                        Photos {photosRequired && <span className="text-destructive">*</span>}
                                        {isAdmin && administrativeUpdate && (
                                            <span className="text-muted-foreground text-xs">(opsional untuk admin)</span>
                                        )}
                                    </Label>
                                    <Input
                                        id="task-photos"
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setPhotos((prev) => [...prev, ...files].slice(0, TASK_PHOTO_MAX));
                                            e.target.value = '';
                                        }}
                                    />
                                    <InputError message={errors.photos} />
                                    <p
                                        className={`text-xs ${
                                            photosRequired && photos.length < TASK_PHOTO_MIN ? 'text-destructive' : 'text-muted-foreground'
                                        }`}
                                    >
                                        {photosRequired && photos.length < TASK_PHOTO_MIN
                                            ? `Wajib upload minimal ${TASK_PHOTO_MIN} foto, maksimal ${TASK_PHOTO_MAX}.`
                                            : `${photos.length} / ${TASK_PHOTO_MAX} foto`}
                                    </p>
                                    {photos.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                            {photos.map((file, i) => (
                                                <div key={i} className="group relative h-20 overflow-hidden rounded border">
                                                    <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(i)}
                                                        className="bg-destructive text-destructive-foreground absolute top-1 right-1 rounded-full p-0.5 opacity-0 transition group-hover:opacity-100"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="assigned_to">Assign To</Label>
                                <select
                                    id="assigned_to"
                                    value={data.assigned_to}
                                    onChange={(e) => setData('assigned_to', e.target.value)}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.assigned_to} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sub_vendor_id">Sub-Vendor (opsional)</Label>
                                <select
                                    id="sub_vendor_id"
                                    value={data.sub_vendor_id}
                                    onChange={(e) => setData('sub_vendor_id', e.target.value)}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <option value="">Tidak ada</option>
                                    {subVendors.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-muted-foreground text-xs">Bila diisi, semua user sub-vendor bisa update task ini.</p>
                                <InputError message={errors.sub_vendor_id} />
                            </div>

                            {canChangeDates && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="start_date">Start Date</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                        />
                                        <InputError message={errors.start_date} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="due_date">Due Date</Label>
                                        <Input
                                            id="due_date"
                                            type="date"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                        />
                                        <InputError message={errors.due_date} />
                                    </div>
                                </div>
                            )}

                            {canChangeDates && data.is_recurring && (
                                <div className="space-y-4 rounded-lg border p-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_recurring"
                                            checked={data.is_recurring}
                                            onChange={(e) => setData('is_recurring', e.target.checked)}
                                            className="border-input rounded"
                                        />
                                        <Label htmlFor="is_recurring" className="text-sm font-medium">
                                            Recurring Task
                                        </Label>
                                    </div>

                                    {data.is_recurring && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="recurrence_frequency">Frequency</Label>
                                                <select
                                                    id="recurrence_frequency"
                                                    value={data.recurrence_frequency}
                                                    onChange={(e) => setData('recurrence_frequency', e.target.value)}
                                                    className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                                                >
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="recurrence_interval">Every</Label>
                                                <Input
                                                    id="recurrence_interval"
                                                    type="number"
                                                    min={1}
                                                    value={data.recurrence_interval}
                                                    onChange={(e) => setData('recurrence_interval', parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="recurrence_end_date">Until</Label>
                                                <Input
                                                    id="recurrence_end_date"
                                                    type="date"
                                                    value={data.recurrence_end_date}
                                                    onChange={(e) => setData('recurrence_end_date', e.target.value)}
                                                    disabled={!canChangeDates}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={processing || (photosRequired && photos.length < TASK_PHOTO_MIN)}
                            >
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Update Task
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
