import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock, FileSpreadsheet, FileText, Layers, Lock } from 'lucide-react';
import { useState } from 'react';

import PhotoPreviewDialog from '@/components/photo-preview-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/pages/public/layout';

interface PublicReportProps {
    token: string;
    project: {
        id: number;
        name: string;
        description: string | null;
        status: string;
        progress: number;
        start_date: string | null;
        target_date: string | null;
        cover_image: string | null;
        cover_image_url: string | null;
        budget: number | string | null;
    };
    vendor: {
        id: number;
        name: string;
        logo: string | null;
        logo_url: string | null;
    } | null;
    rab_summary: {
        items: number;
        total: number;
    };
    phases: Array<{
        id: number;
        name: string;
        progress: number;
        status: string;
        tasks: Array<{
            id: number;
            name: string;
            status: string;
            progress: number;
            updated_at: string | null;
            latest_update: {
                description: string;
                created_at: string;
                photos: Array<{ id: number; path: string; url: string }>;
            } | null;
        }>;
    }>;
    access_count: number;
    expires_at: string | null;
    generated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
    not_started: 'Belum Mulai',
    in_progress: 'Berjalan',
    review: 'Review',
    done: 'Selesai',
    revisi: 'Revisi',
};

const STATUS_COLORS: Record<string, string> = {
    not_started: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
    revisi: 'bg-red-100 text-red-700',
};

const PHASE_STATUS_COLORS: Record<string, string> = {
    not_started: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
};

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatRupiah(value: number): string {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(value);
}

export default function PublicReport({ token, project, vendor, rab_summary, phases, access_count, expires_at, generated_at }: PublicReportProps) {
    const [photoIndex, setPhotoIndex] = useState(0);
    const [photoOpen, setPhotoOpen] = useState(false);
    const [photoList, setPhotoList] = useState<Array<{ id: number; path: string; url: string; description: string; created_at: string | null }>>([]);

    const openPhoto = (index: number, photos: Array<{ id: number; path: string; url: string }>, description: string, createdAt: string | null) => {
        setPhotoList(photos.map((p) => ({ ...p, description, created_at: createdAt })));
        setPhotoIndex(index);
        setPhotoOpen(true);
    };

    const handleLock = () => {
        router.post(`/r/${token}/logout`);
    };

    const downloadReport = (format: 'pdf' | 'csv') => {
        window.location.href = `/r/${token}/${format}`;
    };

    return (
        <PublicLayout title={`Laporan ${project.name}`}>
            <Head title={`Laporan ${project.name}`} />

            <div className="space-y-6">
                <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            {vendor?.logo_url ? (
                                <img src={vendor.logo_url} alt={vendor.name} className="h-12 w-12 rounded-md border object-contain" />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-lg font-bold text-slate-700">
                                    {vendor?.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{vendor?.name ?? 'Progressia'}</p>
                                <h1 className="text-xl font-bold text-slate-900">Laporan Progress</h1>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => downloadReport('pdf')}>
                                <FileText className="mr-1 h-3 w-3" /> PDF
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadReport('csv')}>
                                <FileSpreadsheet className="mr-1 h-3 w-3" /> CSV
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleLock}>
                                <Lock className="mr-1 h-3 w-3" /> Kunci
                            </Button>
                        </div>
                    </div>
                </header>

                {project.cover_image_url && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <img src={project.cover_image_url} alt={project.name} className="h-56 w-full object-cover" />
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="text-xl">{project.name}</CardTitle>
                                {project.description && (
                                    <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{project.description}</p>
                                )}
                            </div>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[project.status] ?? 'bg-slate-100 text-slate-700'}`}
                            >
                                {(STATUS_LABELS[project.status] ?? project.status).toUpperCase()}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-muted-foreground text-xs">Vendor</p>
                                <p className="text-sm font-medium">{vendor?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Periode</p>
                                <p className="text-sm font-medium">
                                    {formatDate(project.start_date)} → {formatDate(project.target_date)}
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress Keseluruhan</span>
                                <span className="font-bold">{project.progress}%</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-slate-200">
                                <div className="h-3 rounded-full bg-blue-600 transition-all" style={{ width: `${project.progress}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileSpreadsheet className="h-4 w-4" /> Ringkasan RAB
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-muted-foreground text-xs uppercase">Total Item</p>
                                <p className="mt-1 text-2xl font-bold">{rab_summary.items}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-muted-foreground text-xs uppercase">Total Anggaran</p>
                                <p className="mt-1 text-2xl font-bold">{formatRupiah(rab_summary.total)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Layers className="h-4 w-4" /> Phase &amp; Task
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {phases.length === 0 && <p className="text-muted-foreground py-4 text-center text-sm">Belum ada phase.</p>}
                        {phases.map((phase) => (
                            <div key={phase.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                                        <Layers className="text-muted-foreground h-3.5 w-3.5" />
                                        {phase.name}
                                    </h3>
                                    <Badge variant="secondary" className={PHASE_STATUS_COLORS[phase.status] ?? 'bg-slate-100'}>
                                        {phase.progress}%
                                    </Badge>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-200">
                                    <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${phase.progress}%` }} />
                                </div>

                                {phase.tasks.length === 0 ? (
                                    <p className="text-muted-foreground ml-5 text-xs italic">Tidak ada task.</p>
                                ) : (
                                    <ul className="ml-1 space-y-2">
                                        {phase.tasks.map((task) => (
                                            <li key={task.id} className="rounded-md border border-slate-200 p-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex items-start gap-2">
                                                        {task.status === 'done' ? (
                                                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Clock className="text-muted-foreground mt-0.5 h-4 w-4" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium">{task.name}</p>
                                                            <p className="text-muted-foreground text-xs">
                                                                {STATUS_LABELS[task.status] ?? task.status} &middot; {task.progress}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {task.latest_update?.photos && task.latest_update.photos.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {task.latest_update.photos.map((photo, i) => (
                                                                <button
                                                                    key={photo.id}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openPhoto(
                                                                            i,
                                                                            task.latest_update!.photos,
                                                                            task.latest_update!.description,
                                                                            task.latest_update!.created_at,
                                                                        )
                                                                    }
                                                                    className="bg-muted block h-14 w-14 overflow-hidden rounded border"
                                                                >
                                                                    <img
                                                                        src={photo.url}
                                                                        alt=""
                                                                        className="h-full w-full object-cover transition hover:scale-105"
                                                                        loading="lazy"
                                                                    />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <footer className="text-muted-foreground flex flex-col items-center gap-1 py-4 text-center text-xs">
                    <p>
                        Laporan ini dihasilkan oleh <strong>Progressia</strong> &middot; {formatDateTime(generated_at)}
                    </p>
                    <p>
                        Diakses {access_count}x &middot; Berlaku hingga {formatDate(expires_at)}
                    </p>
                    {vendor?.name && <p>Oleh {vendor.name}</p>}
                </footer>
            </div>

            <PhotoPreviewDialog
                open={photoOpen}
                photos={photoList}
                index={photoIndex}
                onIndexChange={setPhotoIndex}
                onClose={() => setPhotoOpen(false)}
            />
        </PublicLayout>
    );
}
