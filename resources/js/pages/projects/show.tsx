import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Archive,
    Copy,
    Download,
    ExternalLink,
    Eye,
    EyeOff,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    Heart,
    Key,
    Layers,
    Link as LinkIcon,
    LoaderCircle,
    Pencil,
    Plus,
    RotateCcw,
    Trash2,
    Upload,
    Users,
    X,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import ConfirmDialog from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import TagInput from '@/components/tag-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { buildWhatsAppLink } from '@/components/whatsapp-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { toast } from 'sonner';

type PageProps = SharedData & {
    new_report_link?: {
        id: number;
        token: string;
        password: string;
        expires_at: string | null;
    };
    reset_report_link?: {
        id: number;
        password: string;
    };
};
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Detail', href: '' },
];

interface Phase {
    id: number;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    sort_order: number;
    tasks_count: number;
    created_at: string;
    start_date: string | null;
    end_date: string | null;
}

interface Document {
    id: number;
    name: string;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    category: string;
    version: number;
    uploader: { id: number; name: string } | null;
    created_at: string;
}

interface Project {
    id: number;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    cover_image: string | null;
    categories: string[] | null;
    tags: string[] | null;
    vendor: { id: number; name: string } | null;
    subVendor: { id: number; name: string } | null;
    createdBy: { id: number; name: string } | null;
    archived_at: string | null;
    phases: Phase[];
    members: { id: number; name: string }[];
    clients: { id: number; name: string }[];
    documents: Document[];
    documents_count: number;
    tasks_count: number;
    start_date: string | null;
    target_date: string | null;
    budget: number | null;
    created_at: string;
}

const statusColors: Record<string, string> = {
    not_started: 'secondary',
    in_progress: 'default',
    review: 'warning',
    done: 'success',
};

export default function ProjectsShow({
    project,
    isFavorited,
    allClients,
    allMembers,
    rabBudget = 0,
    isClient = false,
    reportLinks = [],
    whatsappPhone = null,
    can = { delete: false, update: false, forceDelete: false, restore: false, manage_report_links: false },
}: {
    project: Project;
    isFavorited: boolean;
    allClients: { id: number; name: string }[];
    allMembers: { id: number; name: string }[];
    rabBudget?: number;
    isClient?: boolean;
    reportLinks?: Array<{
        id: number;
        token: string;
        expires_at: string | null;
        last_accessed_at: string | null;
        access_count: number;
        reveal_count: number;
        last_revealed_at: string | null;
        created_at: string;
    }>;
    whatsappPhone?: string | null;
    can?: { delete?: boolean; update?: boolean; forceDelete?: boolean; restore?: boolean; manage_report_links?: boolean };
}) {
    const page = usePage<PageProps>();
    const newLink = page.props.new_report_link ?? null;
    const resetLink = page.props.reset_report_link ?? null;

    const [showMemberSelect, setShowMemberSelect] = useState(false);
    const [showClientSelect, setShowClientSelect] = useState(false);

    const [showDocUpload, setShowDocUpload] = useState(false);

    const [confirmDelete, setConfirmDelete] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({ open: false, title: '', description: '', onConfirm: () => {} });

    const [creatingLink, setCreatingLink] = useState(false);
    const [revokingLinkId, setRevokingLinkId] = useState<number | null>(null);
    const [revealingLinkId, setRevealingLinkId] = useState<number | null>(null);
    const [resettingLinkId, setResettingLinkId] = useState<number | null>(null);
    const [revealedPasswords, setRevealedPasswords] = useState<Record<number, string>>({});

    const askConfirm = (title: string, description: string, onConfirm: () => void) => {
        setConfirmDelete({ open: true, title, description, onConfirm });
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const {
        data: clientData,
        setData: setClientData,
        post: clientPost,
    } = useForm({
        user_id: '',
    });

    const addPhase: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('phases.store', project.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
    const {
        data: editPhaseData,
        setData: setEditPhaseData,
        put: putEditPhase,
        processing: editPhaseProcessing,
        errors: editPhaseErrors,
        reset: resetEditPhase,
    } = useForm<{
        name: string;
        description: string;
        status: string;
        start_date: string;
        end_date: string;
    }>({
        name: '',
        description: '',
        status: 'not_started',
        start_date: '',
        end_date: '',
    });

    const openEditPhase = (phase: Phase) => {
        setEditingPhase(phase);
        setEditPhaseData({
            name: phase.name,
            description: phase.description ?? '',
            status: phase.status,
            start_date: phase.start_date?.slice(0, 10) ?? '',
            end_date: phase.end_date?.slice(0, 10) ?? '',
        });
    };

    const closeEditPhase = () => {
        setEditingPhase(null);
        resetEditPhase();
    };

    const submitEditPhase: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingPhase) return;
        putEditPhase(route('phases.update', [project.id, editingPhase.id]), {
            preserveScroll: true,
            onSuccess: () => closeEditPhase(),
        });
    };

    const removePhase = (phase: Phase) => {
        askConfirm('Hapus Fase', `Yakin ingin menghapus fase "${phase.name}"?`, () => router.delete(route('phases.destroy', [project.id, phase.id])));
    };

    const handleArchive = () => {
        if (project.archived_at) {
            router.post(route('projects.unarchive', project.id));
        } else {
            router.post(route('projects.archive', project.id));
        }
    };

    const handleDelete = () => {
        askConfirm(
            'Hapus Proyek',
            `Yakin ingin menghapus proyek "${project.name}"? Proyek akan dipindahkan ke trash dan dapat dipulihkan nanti.`,
            () => router.delete(route('projects.destroy', project.id)),
        );
    };

    const addClient = () => {
        if (clientData.user_id) {
            clientPost(route('projects.clients.attach', project.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setClientData('user_id', '');
                    setShowClientSelect(false);
                },
            });
        }
    };

    const removeClient = (userId: number, name: string) => {
        askConfirm('Hapus Client', `Yakin ingin menghapus client "${name}" dari proyek ini?`, () =>
            router.delete(route('projects.clients.detach', [project.id, userId]), { preserveScroll: true }),
        );
    };

    const {
        data: memberData,
        setData: setMemberData,
        post: memberPost,
    } = useForm({
        user_id: '',
    });

    const {
        data: tagsData,
        setData: setTagsData,
        post: postTags,
        processing: tagsProcessing,
    } = useForm({
        tags: project.tags ?? [],
    });

    const addMember = () => {
        if (memberData.user_id) {
            memberPost(route('projects.members.attach', project.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setMemberData('user_id', '');
                    setShowMemberSelect(false);
                },
            });
        }
    };

    const removeMember = (userId: number, name: string) => {
        askConfirm('Hapus Anggota', `Yakin ingin menghapus anggota "${name}" dari proyek ini?`, () =>
            router.delete(route('projects.members.detach', [project.id, userId]), { preserveScroll: true }),
        );
    };

    const {
        data: docData,
        setData: setDocData,
        post: docPost,
        processing: docProcessing,
        reset: docReset,
        errors: docErrors,
    } = useForm({
        name: '',
        category: 'other',
        file: null as File | null,
    });

    const uploadDoc: FormEventHandler = (e) => {
        e.preventDefault();
        docPost(route('documents.store', project.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                docReset();
                setShowDocUpload(false);
            },
        });
    };

    const createReportLink = () => {
        setCreatingLink(true);
        router.post(
            route('projects.report-links.store', project.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setCreatingLink(false),
            },
        );
    };

    const revokeReportLink = (linkId: number) => {
        askConfirm('Revoke Link', 'Yakin ingin menonaktifkan link ini? Siapapun yang memiliki link ini tidak akan bisa lagi membuka laporan.', () => {
            setRevokingLinkId(linkId);
            router.delete(route('projects.report-links.destroy', [project.id, linkId]), {
                preserveScroll: true,
                onFinish: () => setRevokingLinkId(null),
            });
        });
    };

    const fetchPassword = async (linkId: number): Promise<string | null> => {
        if (revealedPasswords[linkId]) {
            return revealedPasswords[linkId];
        }

        setRevealingLinkId(linkId);
        try {
            const res = await fetch(route('projects.report-links.reveal', [project.id, linkId]));
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? 'Gagal memuat password.');
            }
            const data = await res.json();
            setRevealedPasswords((prev) => ({ ...prev, [linkId]: data.password }));
            return data.password;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Gagal memuat password.');
            return null;
        } finally {
            setRevealingLinkId(null);
        }
    };

    const hidePassword = (linkId: number) => {
        setRevealedPasswords((prev) => {
            const next = { ...prev };
            delete next[linkId];
            return next;
        });
    };

    const handleResetPassword = (linkId: number) => {
        askConfirm(
            'Reset Password',
            'Password lama akan langsung tidak berlaku. Client yang sedang membuka link harus memasukkan password baru.',
            () => {
                setResettingLinkId(linkId);
                router.post(
                    route('projects.report-links.reset-password', [project.id, linkId]),
                    {},
                    {
                        preserveScroll: true,
                        onFinish: () => {
                            setResettingLinkId(null);
                            hidePassword(linkId);
                        },
                    },
                );
            },
        );
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // ignore
        }
    };

    const buildReportUrl = (token: string) => `${window.location.origin}/r/${token}`;

    const buildWhatsAppMessage = (token: string, password: string): string => {
        const url = buildReportUrl(token);
        const expiresAt = newLink?.expires_at ? new Date(newLink.expires_at) : null;
        const dateStr = expiresAt ? expiresAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
        return [
            `Halo ${project.clients[0]?.name ?? 'Bapak/Ibu'},`,
            '',
            `Berikut link laporan progress proyek *${project.name}*:`,
            '',
            `🔗 ${url}`,
            `🔑 Password: ${password}`,
            '',
            `Link ini berlaku hingga *${dateStr}*.`,
            '',
            `Buka link di browser, masukkan password di atas untuk melihat ringkasan progress proyek (status, progress, RAB, phase, dan task).`,
            '',
            'Terima kasih.',
            `— ${project.vendor?.name ?? 'Progressia'}`,
        ].join('\n');
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '-';
        const kb = bytes / 1024;
        if (kb < 1024) return kb.toFixed(1) + ' KB';
        return (kb / 1024).toFixed(1) + ' MB';
    };

    const unassignedMembers = allMembers.filter((m) => !project.members.some((pm) => pm.id === m.id));

    const unassignedClients = allClients.filter((c) => !project.clients.some((pc) => pc.id === c.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <p className="text-muted-foreground text-sm">
                            {project.vendor?.name} &middot; Created {new Date(project.created_at).toLocaleDateString('id-ID')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.post(route('projects.favorite', project.id))}>
                            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        {can.update && (
                            <Link href={route('projects.edit', project.id)}>
                                <Button variant="outline" size="sm">
                                    <Pencil className="mr-1 h-3 w-3" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {can.create && (
                            <Button variant="outline" size="sm" onClick={() => router.post(route('projects.duplicate', project.id))}>
                                <Copy className="mr-1 h-3 w-3" />
                                Duplicate
                            </Button>
                        )}
                        {can.update && (
                            <Button variant="outline" size="sm" onClick={handleArchive}>
                                {project.archived_at ? <RotateCcw className="mr-1 h-3 w-3" /> : <Archive className="mr-1 h-3 w-3" />}
                                {project.archived_at ? 'Unarchive' : 'Archive'}
                            </Button>
                        )}
                        {can.delete && (
                            <Button variant="ghost" size="sm" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {project.cover_image && (
                    <div className="overflow-hidden rounded-xl border">
                        <img src={`/storage/${project.cover_image}`} alt={project.name} className="h-48 w-full object-cover" />
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Overall progress</span>
                                    <span className="font-bold">{project.progress}%</span>
                                </div>
                                <div className="bg-secondary h-3 w-full rounded-full">
                                    <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                                </div>
                                <div className="text-muted-foreground mt-4 flex items-center gap-4 text-sm">
                                    <Badge
                                        variant={
                                            statusColors[project.status] as
                                                | 'default'
                                                | 'secondary'
                                                | 'destructive'
                                                | 'outline'
                                                | 'warning'
                                                | 'success'
                                        }
                                    >
                                        {project.status.replace('_', ' ')}
                                    </Badge>
                                    {!isClient ? (
                                        <Link href={route('projects.tasks.index', project.id)} className="hover:underline">
                                            {project.tasks_count} tasks
                                        </Link>
                                    ) : (
                                        <span>{project.tasks_count} tasks</span>
                                    )}
                                    <span>{project.documents_count} documents</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Phases ({project.phases.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {project.phases.map((phase) => (
                                    <div key={phase.id} className="rounded-lg border p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Layers className="text-muted-foreground h-5 w-5" />
                                                <div>
                                                    <p className="font-medium">{phase.name}</p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {phase.tasks_count} tasks &middot; {phase.progress}% complete
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        statusColors[phase.status] as
                                                            | 'default'
                                                            | 'secondary'
                                                            | 'destructive'
                                                            | 'outline'
                                                            | 'warning'
                                                            | 'success'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {phase.status.replace('_', ' ')}
                                                </Badge>
                                                {!isClient && (
                                                    <Link href={route('projects.tasks.index', [project.id, { phase_id: phase.id }])}>
                                                        <Button variant="outline" size="sm">
                                                            <FolderOpen className="mr-1 h-3 w-3" />
                                                            Tasks
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => can.update && openEditPhase(phase)}
                                                    disabled={!can.update}
                                                    aria-label="Edit fase"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => can.update && removePhase(phase)}
                                                    disabled={!can.update}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="bg-secondary mt-2 h-2 w-full rounded-full">
                                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${phase.progress}%` }} />
                                        </div>
                                    </div>
                                ))}

                                {can.update && (
                                    <form onSubmit={addPhase} className="flex items-end gap-3 border-t pt-4">
                                        <div className="grid flex-1 gap-1">
                                            <Label htmlFor="name" className="text-xs">
                                                Phase name
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g. Foundation"
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <Button type="submit" size="sm" disabled={processing}>
                                            {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Add'}
                                        </Button>
                                    </form>
                                )}

                                {project.phases.length === 0 && <p className="text-muted-foreground py-4 text-center text-sm">No phases yet.</p>}

                                <Dialog
                                    open={editingPhase !== null}
                                    onOpenChange={(open) => {
                                        if (!open) closeEditPhase();
                                    }}
                                >
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Fase</DialogTitle>
                                            <DialogDescription>Ubah nama, status, dan tanggal fase.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={submitEditPhase} className="space-y-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-phase-name">Nama</Label>
                                                <Input
                                                    id="edit-phase-name"
                                                    value={editPhaseData.name}
                                                    onChange={(e) => setEditPhaseData('name', e.target.value)}
                                                    required
                                                />
                                                <InputError message={editPhaseErrors.name} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-phase-description">Deskripsi (opsional)</Label>
                                                <textarea
                                                    id="edit-phase-description"
                                                    value={editPhaseData.description}
                                                    onChange={(e) => setEditPhaseData('description', e.target.value)}
                                                    rows={3}
                                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                                <InputError message={editPhaseErrors.description} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-phase-status">Status</Label>
                                                <select
                                                    id="edit-phase-status"
                                                    value={editPhaseData.status}
                                                    onChange={(e) => setEditPhaseData('status', e.target.value)}
                                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                >
                                                    <option value="not_started">Not Started</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="review">Review</option>
                                                    <option value="done">Done</option>
                                                </select>
                                                <InputError message={editPhaseErrors.status} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-phase-start">Mulai</Label>
                                                    <Input
                                                        id="edit-phase-start"
                                                        type="date"
                                                        value={editPhaseData.start_date}
                                                        onChange={(e) => setEditPhaseData('start_date', e.target.value)}
                                                    />
                                                    <InputError message={editPhaseErrors.start_date} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-phase-end">Selesai</Label>
                                                    <Input
                                                        id="edit-phase-end"
                                                        type="date"
                                                        value={editPhaseData.end_date}
                                                        onChange={(e) => setEditPhaseData('end_date', e.target.value)}
                                                    />
                                                    <InputError message={editPhaseErrors.end_date} />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={closeEditPhase} disabled={editPhaseProcessing}>
                                                    Batal
                                                </Button>
                                                <Button type="submit" disabled={editPhaseProcessing}>
                                                    {editPhaseProcessing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                                    Simpan
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Documents ({project.documents.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {project.documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{doc.name}</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {doc.category} &middot; {formatFileSize(doc.file_size)}
                                                    {doc.uploader && ` · by ${doc.uploader.name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Link href={route('documents.download', [project.id, doc.id])}>
                                                <Button variant="ghost" size="sm">
                                                    <Download className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    askConfirm('Hapus Dokumen', `Yakin ingin menghapus dokumen "${doc.name}"?`, () =>
                                                        router.delete(route('documents.destroy', [project.id, doc.id]), { preserveScroll: true }),
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {showDocUpload ? (
                                    <form onSubmit={uploadDoc} className="space-y-3 border-t pt-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="doc-name" className="text-xs">
                                                Document name
                                            </Label>
                                            <Input
                                                id="doc-name"
                                                value={docData.name}
                                                onChange={(e) => setDocData('name', e.target.value)}
                                                placeholder="e.g. Contract v2"
                                            />
                                            <InputError message={docErrors.name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="doc-cat" className="text-xs">
                                                Category
                                            </Label>
                                            <select
                                                id="doc-cat"
                                                value={docData.category}
                                                onChange={(e) => setDocData('category', e.target.value)}
                                                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                                            >
                                                <option value="contract">Contract</option>
                                                <option value="drawing">Drawing</option>
                                                <option value="report">Report</option>
                                                <option value="permit">Permit</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="doc-file" className="text-xs">
                                                File (max 10MB)
                                            </Label>
                                            <Input id="doc-file" type="file" onChange={(e) => setDocData('file', e.target.files?.[0] ?? null)} />
                                            <InputError message={docErrors.file} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button type="submit" size="sm" disabled={docProcessing}>
                                                {docProcessing ? (
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Upload className="mr-1 h-3 w-3" />
                                                )}
                                                Upload
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setShowDocUpload(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                ) : can.update ? (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDocUpload(true)}>
                                        <Upload className="mr-1 h-3 w-3" />
                                        Upload Document
                                    </Button>
                                ) : null}

                                {project.documents.length === 0 && !showDocUpload && (
                                    <p className="text-muted-foreground py-4 text-center text-sm">No documents yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {project.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">{project.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {project.categories && project.categories.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Categories</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-1">
                                    {project.categories.map((cat) => (
                                        <Badge key={cat} variant="outline">
                                            {cat}
                                        </Badge>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {project.tags && project.tags.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Tags</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-1">
                                    {project.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {can.update && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Edit Tags</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <TagInput value={tagsData.tags as string[]} onChange={(v) => setTagsData('tags', v)} placeholder="Add tag..." />
                                    <Button size="sm" disabled={tagsProcessing} onClick={() => postTags(route('projects.tags.update', project.id))}>
                                        {tagsProcessing ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : null}
                                        Simpan Tags
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Schedule</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Start</span>
                                    <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID') : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Target</span>
                                    <span>{project.target_date ? new Date(project.target_date).toLocaleDateString('id-ID') : '-'}</span>
                                </div>
                                {project.budget && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Budget</span>
                                        <span className="font-medium">Rp {project.budget.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {!isClient && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">RAB (Budget Plan)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Items</span>
                                        <span className="font-medium">{project.rab_items_count ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Budget</span>
                                        <span className="font-medium">Rp {(rabBudget ?? 0).toLocaleString('id-ID')}</span>
                                    </div>
                                    <Link href={route('projects.rab.index', project.id)} className="mt-2 block">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <FileSpreadsheet className="mr-1 h-3 w-3" />
                                            Manage RAB
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {can.manage_report_links && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <LinkIcon className="h-4 w-4" />
                                        Shareable Report Link
                                    </CardTitle>
                                    <CardDescription>Buat link publik + password untuk dikirim ke client yang tidak punya akun.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button size="sm" onClick={createReportLink} disabled={creatingLink}>
                                        {creatingLink ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Plus className="mr-1 h-3 w-3" />}
                                        Buat Link Baru
                                    </Button>

                                    {reportLinks.length === 0 ? (
                                        <p className="text-muted-foreground text-xs">Belum ada link aktif.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {reportLinks.map((link) => {
                                                const url = buildReportUrl(link.token);
                                                return (
                                                    <div key={link.id} className="space-y-2 rounded-md border p-3 text-sm">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <TooltipProvider delayDuration={400}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <code
                                                                            className="bg-muted hover:bg-muted/70 cursor-help truncate rounded px-2 py-0.5 text-xs transition-colors"
                                                                            onMouseEnter={() => fetchPassword(link.id)}
                                                                        >
                                                                            /r/{link.token}
                                                                        </code>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="bottom" className="max-w-xs">
                                                                        {revealingLinkId === link.id ? (
                                                                            <span className="flex items-center gap-1.5 text-xs">
                                                                                <LoaderCircle className="h-3 w-3 animate-spin" /> Memuat...
                                                                            </span>
                                                                        ) : revealedPasswords[link.id] ? (
                                                                            <div className="space-y-1">
                                                                                <p className="text-muted-foreground text-[10px] uppercase">
                                                                                    Password
                                                                                </p>
                                                                                <code className="font-mono text-xs">
                                                                                    {revealedPasswords[link.id]}
                                                                                </code>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs">Hover untuk memuat password</span>
                                                                        )}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                            <div className="flex shrink-0 items-center gap-1">
                                                                <Badge variant="secondary">{link.access_count}x</Badge>
                                                                {link.reveal_count > 0 && (
                                                                    <Badge variant="outline">{link.reveal_count}x reveal</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-muted-foreground text-xs">
                                                            Exp:{' '}
                                                            {link.expires_at
                                                                ? new Date(link.expires_at).toLocaleDateString('id-ID', {
                                                                      day: '2-digit',
                                                                      month: 'short',
                                                                      year: 'numeric',
                                                                  })
                                                                : '—'}
                                                            {' • '}
                                                            Last:{' '}
                                                            {link.last_accessed_at
                                                                ? new Date(link.last_accessed_at).toLocaleString('id-ID', {
                                                                      day: '2-digit',
                                                                      month: 'short',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                  })
                                                                : '—'}
                                                            {link.last_revealed_at && (
                                                                <>
                                                                    {' • '}
                                                                    Revealed:{' '}
                                                                    {new Date(link.last_revealed_at).toLocaleString('id-ID', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </>
                                                            )}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(url)}>
                                                                <Copy className="mr-1 h-3 w-3" /> Copy URL
                                                            </Button>
                                                            {revealedPasswords[link.id] ? (
                                                                <Button size="sm" variant="outline" onClick={() => hidePassword(link.id)}>
                                                                    <EyeOff className="mr-1 h-3 w-3" /> Sembunyikan
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => fetchPassword(link.id)}
                                                                    disabled={revealingLinkId === link.id}
                                                                >
                                                                    {revealingLinkId === link.id ? (
                                                                        <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <Eye className="mr-1 h-3 w-3" />
                                                                    )}
                                                                    Lihat Password
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleResetPassword(link.id)}
                                                                disabled={resettingLinkId === link.id}
                                                            >
                                                                {resettingLinkId === link.id ? (
                                                                    <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Key className="mr-1 h-3 w-3" />
                                                                )}
                                                                Reset Password
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => revokeReportLink(link.id)}
                                                                disabled={revokingLinkId === link.id}
                                                            >
                                                                {revokingLinkId === link.id ? (
                                                                    <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                                )}
                                                                Revoke
                                                            </Button>
                                                        </div>
                                                        {revealedPasswords[link.id] && (
                                                            <div className="flex items-center gap-2 rounded-md border border-dashed bg-slate-50 p-2 dark:bg-slate-900">
                                                                <code className="flex-1 font-mono text-xs">{revealedPasswords[link.id]}</code>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => copyToClipboard(revealedPasswords[link.id])}
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {project.createdBy && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Created By</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{project.createdBy.name}</p>
                                </CardContent>
                            </Card>
                        )}

                        {project.subVendor && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Sub Vendor</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{project.subVendor.name}</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Users className="h-4 w-4" />
                                    Team ({project.members.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {project.members.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between">
                                        <span className="text-sm">{m.name}</span>
                                        {can.update && (
                                            <Button variant="ghost" size="sm" onClick={() => removeMember(m.id, m.name)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {showMemberSelect ? (
                                    <div className="flex items-center gap-2 pt-2">
                                        <select
                                            value={memberData.user_id}
                                            onChange={(e) => setMemberData('user_id', e.target.value)}
                                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                                        >
                                            <option value="">Select member...</option>
                                            {unassignedMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Button size="sm" onClick={addMember}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setShowMemberSelect(false)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowMemberSelect(true)}>
                                        <Plus className="mr-1 h-3 w-3" />
                                        Add Member
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Clients ({project.clients.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {project.clients.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between">
                                        <span className="text-sm">{c.name}</span>
                                        {can.update && (
                                            <Button variant="ghost" size="sm" onClick={() => removeClient(c.id, c.name)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {showClientSelect ? (
                                    <div className="flex items-center gap-2 pt-2">
                                        <select
                                            value={clientData.user_id}
                                            onChange={(e) => setClientData('user_id', e.target.value)}
                                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                                        >
                                            <option value="">Select client...</option>
                                            {unassignedClients.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Button size="sm" onClick={addClient}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setShowClientSelect(false)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowClientSelect(true)}>
                                        <Plus className="mr-1 h-3 w-3" />
                                        Add Client
                                    </Button>
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

            <Dialog
                open={!!newLink}
                onOpenChange={(open) => {
                    if (!open) {
                        router.reload({ only: ['new_report_link'] });
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link Berhasil Dibuat</DialogTitle>
                        <DialogDescription>Simpan URL dan password di tempat aman. Password hanya ditampilkan sekali.</DialogDescription>
                    </DialogHeader>

                    {newLink && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs">URL</Label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-muted flex-1 rounded p-2 text-xs break-all">{buildReportUrl(newLink.token)}</code>
                                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(buildReportUrl(newLink.token))}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Password</Label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-muted flex-1 rounded p-2 font-mono text-sm">{newLink.password}</code>
                                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(newLink.password)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                                {newLink.expires_at && (
                                    <p className="text-muted-foreground text-xs">
                                        Berlaku hingga{' '}
                                        {new Date(newLink.expires_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                )}
                            </div>

                            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                                {whatsappPhone ? (
                                    <a
                                        href={buildWhatsAppLink(whatsappPhone, buildWhatsAppMessage(newLink.token, newLink.password))}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button size="sm" variant="outline" className="w-full">
                                            <ExternalLink className="mr-1 h-3 w-3" /> Kirim via WhatsApp
                                        </Button>
                                    </a>
                                ) : (
                                    <Button size="sm" variant="outline" className="flex-1" disabled title="Belum ada client dengan nomor WhatsApp">
                                        <ExternalLink className="mr-1 h-3 w-3" /> Kirim via WhatsApp
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => copyToClipboard(`${buildReportUrl(newLink.token)}\nPassword: ${newLink.password}`)}
                                >
                                    <Copy className="mr-1 h-3 w-3" /> Copy URL + Password
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!resetLink}
                onOpenChange={(open) => {
                    if (!open) {
                        router.reload({ only: ['reset_report_link'] });
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Password Berhasil Direset</DialogTitle>
                        <DialogDescription>Password lama sudah tidak berlaku. Berikan password baru ini ke client.</DialogDescription>
                    </DialogHeader>

                    {resetLink && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Password Baru</Label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-muted flex-1 rounded p-2 font-mono text-sm">{resetLink.password}</code>
                                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(resetLink.password)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button size="sm" className="w-full" onClick={() => copyToClipboard(`Password baru: ${resetLink.password}`)}>
                                    <Copy className="mr-1 h-3 w-3" /> Copy Password
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
