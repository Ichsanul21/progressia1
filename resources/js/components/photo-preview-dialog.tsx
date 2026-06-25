import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { useEffect } from 'react';

export interface PreviewPhoto {
    id: number;
    path: string;
}

export interface PreviewCaption {
    description?: string | null;
    user?: { id: number; name: string } | null;
    created_at?: string | null;
}

interface PhotoPreviewDialogProps {
    open: boolean;
    photos: PreviewPhoto[];
    captions?: PreviewCaption[];
    index: number;
    onIndexChange: (index: number) => void;
    onClose: () => void;
}

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function PhotoPreviewDialog({ open, photos, captions, index, onIndexChange, onClose }: PhotoPreviewDialogProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onIndexChange(index > 0 ? index - 1 : photos.length - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                onIndexChange(index < photos.length - 1 ? index + 1 : 0);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, index, photos.length, onIndexChange]);

    if (photos.length === 0) return null;

    const photo = photos[index];
    const caption = captions?.[index];

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-4xl gap-0 p-0 sm:rounded-lg">
                <DialogTitle className="sr-only">Pratinjau foto</DialogTitle>

                <div className="relative flex h-[70vh] items-center justify-center bg-black">
                    <img src={`/storage/${photo.path}`} alt="" className="max-h-full max-w-full object-contain" />

                    {photos.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onIndexChange(index > 0 ? index - 1 : photos.length - 1)}
                                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onIndexChange(index < photos.length - 1 ? index + 1 : 0)}
                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </>
                    )}

                    <div className="absolute top-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white">
                        {index + 1} / {photos.length}
                    </div>

                    <a
                        href={`/storage/${photo.path}`}
                        download
                        className="absolute top-2 right-12 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                        title="Unduh"
                    >
                        <Download className="h-4 w-4" />
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                        title="Tutup"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {caption && (caption.description || caption.user || caption.created_at) && (
                    <div className="space-y-1 border-t bg-white p-3 text-sm dark:bg-neutral-900">
                        {caption.description && <p className="text-foreground">{caption.description}</p>}
                        <p className="text-muted-foreground text-xs">
                            {caption.user?.name}
                            {caption.user?.name && caption.created_at ? ' &middot; ' : ''}
                            {formatDateTime(caption.created_at)}
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
