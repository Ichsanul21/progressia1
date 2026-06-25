import PhotoPreviewDialog from '@/components/photo-preview-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Camera, History, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type TimelineEntry = {
    id: string;
    type: 'activity' | 'progress';
    event?: string;
    description?: string;
    user?: { id: number; name: string } | null;
    created_at?: string | null;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
    subject?: 'task' | 'sub_task';
    subject_id?: number;
    subject_name?: string;
    photos?: { id: number; path: string }[];
};

const STATUS_LABELS: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
    revisi: 'Revisi',
};

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function eventBadge(event: string | undefined): {
    icon: React.ReactNode;
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
    switch (event) {
        case 'created':
            return { icon: <Plus className="h-3 w-3" />, label: 'Created', variant: 'secondary' };
        case 'deleted':
            return { icon: <Trash2 className="h-3 w-3" />, label: 'Deleted', variant: 'destructive' };
        case 'status_changed':
            return { icon: <Pencil className="h-3 w-3" />, label: 'Status', variant: 'default' };
        case 'progress_changed':
            return { icon: <Pencil className="h-3 w-3" />, label: 'Progress', variant: 'default' };
        default:
            return { icon: <Pencil className="h-3 w-3" />, label: 'Updated', variant: 'outline' };
    }
}

function FieldDiff({ oldValues, newValues }: { oldValues?: Record<string, unknown> | null; newValues?: Record<string, unknown> | null }) {
    if (!oldValues || !newValues) return null;

    const keys = Object.keys(newValues);
    if (keys.length === 0) return null;

    return (
        <div className="bg-muted/30 space-y-1 rounded-md border p-2 text-xs">
            {keys.map((key) => {
                const oldVal = oldValues[key];
                const newVal = newValues[key];
                if (oldVal === newVal) return null;

                const formattedOld = key === 'status' ? (STATUS_LABELS[String(oldVal)] ?? String(oldVal)) : String(oldVal ?? '—');
                const formattedNew = key === 'status' ? (STATUS_LABELS[String(newVal)] ?? String(newVal)) : String(newVal ?? '—');

                return (
                    <div key={key} className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-muted-foreground font-medium">{key}:</span>
                        <span className="text-destructive/70 line-through">{formattedOld}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground font-medium">{formattedNew}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function HistoryEntry({ entry }: { entry: TimelineEntry }) {
    const isProgress = entry.type === 'progress';
    const badge = isProgress
        ? {
              icon: <Camera className="h-3 w-3" />,
              label: entry.subject === 'sub_task' ? `Sub-task: ${entry.subject_name ?? ''}` : 'Task',
              variant: 'secondary' as const,
          }
        : eventBadge(entry.event);

    const [photoIndex, setPhotoIndex] = useState(0);
    const [photoOpen, setPhotoOpen] = useState(false);

    return (
        <div className="flex gap-3 border-b pb-3 last:border-b-0">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">{entry.user ? getInitials(entry.user.name) : <AlertCircle className="h-4 w-4" />}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-foreground font-medium">{entry.user?.name ?? 'System'}</span>
                    <Badge variant={badge.variant} className="gap-1 px-1.5 py-0 text-[10px]">
                        {badge.icon}
                        {badge.label}
                    </Badge>
                    {isProgress && entry.subject === 'sub_task' && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                            <History className="mr-1 h-3 w-3" />
                            {entry.subject_name}
                        </Badge>
                    )}
                    <span className="text-muted-foreground ml-auto">{formatDateTime(entry.created_at)}</span>
                </div>

                {entry.description && <p className="text-foreground text-sm">{entry.description}</p>}

                <FieldDiff oldValues={entry.old_values} newValues={entry.new_values} />

                {entry.photos && entry.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-3 md:grid-cols-4">
                        {entry.photos.map((photo, i) => (
                            <button
                                key={photo.id}
                                type="button"
                                onClick={() => {
                                    setPhotoIndex(i);
                                    setPhotoOpen(true);
                                }}
                                className="bg-muted block aspect-square overflow-hidden rounded border"
                            >
                                <img
                                    src={`/storage/${photo.path}`}
                                    alt="Progress"
                                    className="h-full w-full object-cover transition hover:scale-105"
                                    loading="lazy"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <PhotoPreviewDialog
                open={photoOpen}
                photos={entry.photos ?? []}
                index={photoIndex}
                onIndexChange={setPhotoIndex}
                onClose={() => setPhotoOpen(false)}
                captions={
                    entry.photos && entry.photos.length > 0
                        ? entry.photos.map(() => ({
                              description: entry.description ?? null,
                              user: entry.user ?? null,
                              created_at: entry.created_at ?? null,
                          }))
                        : undefined
                }
            />
        </div>
    );
}
