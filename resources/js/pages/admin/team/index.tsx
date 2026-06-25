import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsAppButton } from '@/components/whatsapp-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Key, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tim', href: '/admin/team' }];

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone: string;
    must_change_password: boolean;
    sub_vendor: { id: number; name: string } | null;
}

interface Props {
    users: {
        data: UserRow[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters?: { search?: string; vendor_id?: string };
    vendors: { id: number; name: string }[];
}

export default function AdminTeamIndex({ users, filters, vendors }: Props) {
    const { auth, flash } = usePage<{
        auth: { user: { role: string } };
        flash: { success?: string };
    }>().props;
    const isSuperAdmin = auth.user.role === 'super_admin';

    const [search, setSearch] = useState(filters?.search ?? '');
    const [deleting, setDeleting] = useState<UserRow | null>(null);
    const [resetting, setResetting] = useState<UserRow | null>(null);

    const updateFilter = (key: string, value: string) => {
        const newFilters: Record<string, string> = { ...filters } as Record<string, string>;
        if (value) newFilters[key] = value;
        else delete newFilters[key];
        if (key !== 'search') delete newFilters.search;
        router.get(route('admin.team.index'), newFilters, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilter('search', search);
    };

    const handleDelete = () => {
        if (!deleting) return;
        router.delete(route('admin.users.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const handleResetPassword = () => {
        if (!resetting) return;
        router.post(
            route('admin.users.reset-password', resetting.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setResetting(null),
            },
        );
    };

    const buildResetMessage = (u: UserRow) =>
        `Halo ${u.name}, password Progressia Anda sudah direset.\nEmail: ${u.email}\nPassword: password\nLogin: ${window.location.origin}/login\nWajib ganti password setelah login.`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tim" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Tim</h1>
                        <p className="text-muted-foreground text-sm">Anggota tim internal vendor.</p>
                    </div>
                    <Link href={route('admin.users.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Tim
                        </Button>
                    </Link>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                    <Input placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    {isSuperAdmin && (
                        <Select value={filters?.vendor_id || 'all'} onValueChange={(v) => updateFilter('vendor_id', v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Semua vendor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua vendor</SelectItem>
                                {vendors.map((v) => (
                                    <SelectItem key={v.id} value={String(v.id)}>
                                        {v.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button type="submit" variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-4 py-3 text-left font-medium">Nama</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Phone</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((u) => (
                                <tr key={u.id} className="hover:bg-muted/30 border-b transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                        {u.name}
                                        {u.must_change_password && (
                                            <Badge variant="outline" className="ml-2 text-xs text-amber-600">
                                                belum ganti password
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="text-muted-foreground px-4 py-3">{u.email}</td>
                                    <td className="text-muted-foreground px-4 py-3">{u.phone}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={route('admin.users.edit', u.id)}>
                                                <Button variant="ghost" size="sm">
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="sm" onClick={() => setResetting(u)} title="Reset password">
                                                <Key className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleting(u)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Pagination pagination={users} />

                    {users.data.length === 0 && <div className="text-muted-foreground py-12 text-center">Belum ada anggota tim.</div>}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleDelete}
                title="Hapus user"
                description={`Yakin ingin menghapus "${deleting?.name}"?`}
            />

            <ConfirmDialog
                open={!!resetting}
                onOpenChange={(open) => !open && setResetting(null)}
                onConfirm={handleResetPassword}
                title="Reset Password"
                description={`Reset password "${resetting?.name}" ke default "password"?`}
            >
                {resetting && (
                    <div className="pt-2">
                        <WhatsAppButton phone={resetting.phone} message={buildResetMessage(resetting)} label="Kirim instruksi via WhatsApp" />
                    </div>
                )}
            </ConfirmDialog>
        </AppLayout>
    );
}
