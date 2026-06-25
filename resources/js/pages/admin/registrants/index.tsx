import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildWhatsAppLink } from '@/components/whatsapp-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, LoaderCircle, MessageCircle, Search, UserCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pendaftar', href: '/admin/registrants' }];

interface RegistrantRow {
    id: number;
    name: string;
    email: string;
    phone: string;
    company_name: string;
    industry: string;
    team_size: string;
    source: string;
    message: string | null;
    status: string;
    created_at: string;
    reviewed_by: number | null;
    reviewed_at: string | null;
    contacted_at: string | null;
    converted_user_id: number | null;
}

interface Props {
    registrants: {
        data: RegistrantRow[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { search?: string; status?: string };
    statuses: string[];
    industries: Record<string, string>;
    teamSizes: Record<string, string>;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    contacted: 'Dihubungi',
    converted: 'Aktif',
    rejected: 'Ditolak',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    pending: 'outline',
    contacted: 'secondary',
    converted: 'default',
    rejected: 'destructive',
};

function buildInitialTemplate(r: RegistrantRow): string {
    return (
        `Halo ${r.name}, terima kasih telah mendaftar Progressia.\n\n` +
        `Kami sudah menerima pendaftaran Anda dengan detail:\n` +
        `- Perusahaan: ${r.company_name}\n` +
        `- Email: ${r.email}\n\n` +
        `Tim kami akan segera memproses dan menghubungi untuk setup akun. ` +
        `Boleh konfirmasi role yang Anda butuhkan (Admin Vendor / Project Manager / Team Member)?\n\n` +
        `Terima kasih.`
    );
}

export default function AdminRegistrantsIndex({
    registrants,
    filters,
    statuses,
    industries,
    teamSizes,
    vendors,
}: Props & { vendors: { id: number; name: string }[] }) {
    const { props, flash } = usePage<{ props: { waLink?: string; convertedUser?: { name: string; email: string; phone: string } } }>().props;
    const [search, setSearch] = useState(filters?.search ?? '');
    const [deleting, setDeleting] = useState<RegistrantRow | null>(null);
    const [updating, setUpdating] = useState<RegistrantRow | null>(null);
    const [converting, setConverting] = useState<RegistrantRow | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (props?.waLink && props?.convertedUser) {
            toast.success(`Akun ${props.convertedUser.name} dibuat. Kirim kredensial via WhatsApp.`, {
                duration: 15000,
                action: {
                    label: 'Kirim',
                    onClick: () => window.open(props.waLink!, '_blank'),
                },
            });
        }
    }, [props?.waLink, props?.convertedUser]);

    const convertForm = useForm({
        role: 'admin_vendor',
        vendor_id: '',
        sub_vendor_id: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.registrants.index'), { search }, { preserveState: true });
    };

    const handleFilterStatus = (status: string) => {
        router.get(route('admin.registrants.index'), { ...filters, status: status || undefined }, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleting) return;
        router.delete(route('admin.registrants.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const handleUpdateStatus = (status: 'contacted' | 'rejected') => {
        if (!updating) return;
        router.patch(
            route('admin.registrants.update-status', updating.id),
            { status },
            {
                preserveScroll: true,
                onSuccess: () => setUpdating(null),
            },
        );
    };

    const handleConvert = (e: React.FormEvent) => {
        e.preventDefault();
        if (!converting) return;
        convertForm.post(route('admin.registrants.convert', converting.id), {
            preserveScroll: true,
            onSuccess: () => {
                setConverting(null);
                convertForm.reset();
            },
        });
    };

    const openConvertDialog = (r: RegistrantRow) => {
        setConverting(r);
        convertForm.setData({ role: 'admin_vendor', vendor_id: '', sub_vendor_id: '' });
    };

    const handleChatWA = (r: RegistrantRow) => {
        const url = buildWhatsAppLink(r.phone, buildInitialTemplate(r));
        window.open(url, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pendaftar" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Pendaftar</h1>
                        <p className="text-muted-foreground text-sm">Daftar vendor yang ingin mendaftar ke Progressia.</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
                    <Input
                        placeholder="Cari nama / email / perusahaan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                    <select
                        value={filters?.status ?? ''}
                        onChange={(e) => handleFilterStatus(e.target.value)}
                        className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="">Semua status</option>
                        {statuses.map((s) => (
                            <option key={s} value={s}>
                                {STATUS_LABELS[s] ?? s}
                            </option>
                        ))}
                    </select>
                    <Button type="submit" variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-4 py-3 text-left font-medium">Nama / Perusahaan</th>
                                <th className="px-4 py-3 text-left font-medium">Kontak</th>
                                <th className="px-4 py-3 text-left font-medium">Industri / Tim</th>
                                <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrants.data.map((r) => (
                                <tr key={r.id} className="hover:bg-muted/30 border-b transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{r.name}</div>
                                        <div className="text-muted-foreground text-xs">{r.company_name}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs">{r.email}</div>
                                        <div className="text-muted-foreground text-xs">{r.phone}</div>
                                    </td>
                                    <td className="text-muted-foreground px-4 py-3 text-xs">
                                        <div>{industries[r.industry] ?? r.industry}</div>
                                        <div>{teamSizes[r.team_size] ?? r.team_size}</div>
                                    </td>
                                    <td className="text-muted-foreground px-4 py-3 text-xs">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>{STATUS_LABELS[r.status] ?? r.status}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleChatWA(r)} title="Chat WhatsApp">
                                                <MessageCircle className="h-3 w-3" />
                                            </Button>
                                            {['pending', 'contacted'].includes(r.status) && (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => setUpdating(r)} title="Ubah status">
                                                        <UserCheck className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => openConvertDialog(r)} title="Buat akun">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => setDeleting(r)}>
                                                <XCircle className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Pagination pagination={registrants} />

                    {registrants.data.length === 0 && <div className="text-muted-foreground py-12 text-center">Belum ada pendaftar.</div>}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleDelete}
                title="Hapus pendaftar"
                description={`Yakin ingin menghapus pendaftaran "${deleting?.name}"?`}
            />

            <Dialog open={!!updating} onOpenChange={(open) => !open && setUpdating(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ubah status pendaftar</DialogTitle>
                        <DialogDescription>Tandai {updating?.name} sudah dihubungi atau ditolak.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Button onClick={() => handleUpdateStatus('contacted')}>Tandai sudah dihubungi</Button>
                        <Button variant="destructive" onClick={() => handleUpdateStatus('rejected')}>
                            Tandai ditolak
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!converting} onOpenChange={(open) => !open && setConverting(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Buat akun untuk {converting?.name}</DialogTitle>
                        <DialogDescription>
                            Akun baru akan dibuat dengan default password "password". User wajib ganti saat login pertama.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConvert} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={convertForm.data.role} onValueChange={(v) => convertForm.setData('role', v)}>
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin_vendor">Admin Vendor</SelectItem>
                                    <SelectItem value="project_manager">Project Manager</SelectItem>
                                    <SelectItem value="team">Team</SelectItem>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="sub_vendor">Sub-Vendor</SelectItem>
                                </SelectContent>
                            </Select>
                            {convertForm.errors.role && <p className="text-destructive text-xs">{convertForm.errors.role}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="vendor_id">Vendor</Label>
                            <Select value={convertForm.data.vendor_id} onValueChange={(v) => convertForm.setData('vendor_id', v)}>
                                <SelectTrigger id="vendor_id">
                                    <SelectValue placeholder="Pilih vendor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map((v) => (
                                        <SelectItem key={v.id} value={String(v.id)}>
                                            {v.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {convertForm.errors.vendor_id && <p className="text-destructive text-xs">{convertForm.errors.vendor_id}</p>}
                        </div>

                        {convertForm.data.role === 'sub_vendor' && (
                            <div className="grid gap-2">
                                <Label htmlFor="sub_vendor_id">Sub-Vendor</Label>
                                <Input
                                    id="sub_vendor_id"
                                    type="number"
                                    value={convertForm.data.sub_vendor_id}
                                    onChange={(e) => convertForm.setData('sub_vendor_id', e.target.value)}
                                    required
                                />
                                {convertForm.errors.sub_vendor_id && <p className="text-destructive text-xs">{convertForm.errors.sub_vendor_id}</p>}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setConverting(null)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={convertForm.processing}>
                                {convertForm.processing && <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />}
                                Buat Akun
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
