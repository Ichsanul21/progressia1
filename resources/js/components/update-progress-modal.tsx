import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { AlertCircle, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type Status = 'not_started' | 'in_progress' | 'review' | 'done' | 'revisi';

export const STATUS_TRANSITIONS: Record<Status, Status[]> = {
    not_started: ['in_progress'],
    in_progress: ['review'],
    review: ['done', 'revisi'],
    revisi: ['review'],
    done: [],
};

interface UpdateProgressModalProps {
    open: boolean;
    onClose: () => void;
    type: 'task' | 'sub_task';
    projectId: number;
    taskId: number;
    subTaskId?: number;
    currentStatus: Status;
    isAdmin: boolean;
    routeName?: string;
    routeParams?: (string | number)[];
}

const STATUS_LABELS: Record<Status, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
    revisi: 'Revisi',
};

const PHOTO_MIN = 3;
const PHOTO_MAX = 10;

export default function UpdateProgressModal({
    open,
    onClose,
    type,
    projectId,
    taskId,
    subTaskId,
    currentStatus,
    isAdmin,
    routeName,
    routeParams,
}: UpdateProgressModalProps) {
    const isTask = type === 'task';
    const resolvedRouteName = routeName ?? (isTask ? 'tasks.update-progress' : 'sub-tasks.update-progress');
    const resolvedRouteParams = routeParams ?? (isTask ? [projectId, taskId] : [projectId, taskId, subTaskId as number]);

    const validNextStatuses = isAdmin ? (Object.keys(STATUS_TRANSITIONS) as Status[]) : STATUS_TRANSITIONS[currentStatus];

    const formRef = useRef<HTMLFormElement>(null);
    const [status, setStatus] = useState<Status>(currentStatus);
    const [progressDescription, setProgressDescription] = useState('');
    const [administrativeUpdate, setAdministrativeUpdate] = useState(false);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!open) {
            setStatus(currentStatus);
            setProgressDescription('');
            setAdministrativeUpdate(false);
            setPhotoFiles([]);
            setPhotoPreviews([]);
            setServerErrors({});
            setProcessing(false);
        }
    }, [open, currentStatus]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const merged = [...photoFiles, ...files].slice(0, PHOTO_MAX);
        setPhotoFiles(merged);
        setPhotoPreviews(merged.map((f) => URL.createObjectURL(f)));
        e.target.value = '';
    };

    const removePhoto = (index: number) => {
        const next = photoFiles.filter((_, i) => i !== index);
        setPhotoFiles(next);
        setPhotoPreviews(next.map((f) => URL.createObjectURL(f)));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        formData.append('_method', 'PUT');
        photoFiles.forEach((f) => formData.append('photos[]', f));

        setProcessing(true);
        router.post(window.route(resolvedRouteName, resolvedRouteParams), formData, {
            onSuccess: () => {
                setProcessing(false);
                onClose();
            },
            onError: (errors) => {
                setProcessing(false);
                setServerErrors(errors as Record<string, string>);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const needsPhoto = !isAdmin || !administrativeUpdate;
    const canSubmit = !needsPhoto || photoFiles.length >= PHOTO_MIN;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isTask ? 'Update Task Progress' : 'Update Sub-Task Progress'}</DialogTitle>
                    <DialogDescription>
                        {isAdmin
                            ? 'Admin dapat update tanpa foto dengan checkbox Update administratif.'
                            : `Wajib upload minimal ${PHOTO_MIN} foto, maksimal ${PHOTO_MAX} foto sebagai bukti update progress.`}
                    </DialogDescription>
                </DialogHeader>

                <form ref={formRef} onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            name="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Status)}
                            className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                        >
                            <option value={currentStatus}>{STATUS_LABELS[currentStatus]} (saat ini)</option>
                            {validNextStatuses
                                .filter((s) => s !== currentStatus)
                                .map((s) => (
                                    <option key={s} value={s}>
                                        {STATUS_LABELS[s]}
                                    </option>
                                ))}
                        </select>
                        <InputError message={serverErrors.status} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="progress_description">Deskripsi perubahan*</Label>
                        <Textarea
                            id="progress_description"
                            name="progress_description"
                            value={progressDescription}
                            onChange={(e) => setProgressDescription(e.target.value)}
                            placeholder="Jelaskan update progress (min. 10 karakter)"
                            rows={3}
                        />
                        <InputError message={serverErrors.progress_description} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="photos">Foto bukti</Label>
                        {needsPhoto ? (
                            <>
                                <Input id="photos" type="file" multiple accept="image/*" onChange={handlePhotoChange} />
                                <p className={`text-xs ${photoFiles.length < PHOTO_MIN ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {photoFiles.length < PHOTO_MIN ? (
                                        <span className="flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Wajib upload minimal {PHOTO_MIN} foto, maksimal {PHOTO_MAX}.
                                        </span>
                                    ) : (
                                        <>
                                            Foto bukti terpenuhi. Total {photoFiles.length} dari maksimal {PHOTO_MAX}.
                                        </>
                                    )}
                                </p>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-xs">Mode administratif aktif. Upload foto dilewati.</p>
                        )}
                        <p className="text-muted-foreground text-xs">
                            {photoFiles.length} / {PHOTO_MAX} foto
                        </p>
                        {photoPreviews.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {photoPreviews.map((src, i) => (
                                    <div key={i} className="group relative overflow-hidden rounded-md border">
                                        <img src={src} alt={`Preview ${i + 1}`} className="h-20 w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(i)}
                                            className="bg-destructive text-destructive-foreground absolute top-1 right-1 rounded-full p-0.5 opacity-0 transition group-hover:opacity-100"
                                            aria-label="Hapus foto"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <InputError message={serverErrors.photos} />
                    </div>

                    {isAdmin && (
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                name="administrative_update"
                                value="1"
                                checked={administrativeUpdate}
                                onChange={(e) => setAdministrativeUpdate(e.target.checked)}
                                className="rounded"
                            />
                            Update administratif (lewati foto)
                        </label>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing || !canSubmit}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Progress
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
