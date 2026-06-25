import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildWhatsAppLink } from '@/components/whatsapp-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Key, MessageCircle, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Sub-Vendor Users', href: '/admin/sub-vendor-users' }];

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone: string;
    must_change_password: boolean;
    vendor: { id: number; name: string } | null;
    sub_vendor: { id: number; name: string } | null;
}

interface PaginatedUsers {
    data: UserRow[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    users: PaginatedUsers;
    filters: { search?: string; vendor_id?: string; sub_vendor_id?: string };
    vendors: { id: number; name: string }[];
    subVendors: { id: number; name: string; vendor_id: number }[];
}

const buildResetMessage = (u: UserRow) => {
    const loginUrl = typeof window !== 'undefined' ? window.location.origin + '/login' : '/login';
    return (
        `Halo ${u.name}, password Progressia Anda sudah direset.\n` +
        `Email: ${u.email}\n` +
        `Password: password\n` +
        `Login: ${loginUrl}\n` +
        `Wajib ganti password setelah login pertama.`
    );
};

export default function AdminSubVendorUsersIndex({ users, filters, vendors, subVendors }: Props) {
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const isSuperAdmin = auth.user.role === 'super_admin';

    const [search, setSearch] = useState(filters?.search ?? '');
    const [deleting, setDeleting] = useState<UserRow | null>(null);
    const [resetting, setResetting] = useState<UserRow | null>(null);

    const updateFilter = (key: string, value: string) => {
        const newFilters: Record<string, string> = { ...filters };
        if (value) newFilters[key] = value;
        else delete newFilters[key];
        router.get(route('admin.sub-vendor-users.index'), newFilters, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilter('search', search);
    };

    const handleDelete = () => {
        if (!deleting) return;
        router.delete(route('admin.users.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User dihapus.');
                setDeleting(null);
            },
        });
    };

    const handleReset = () => {
        if (!resetting) return;
        router.post(
            route('admin.users.reset-password', resetting.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Password direset ke: password. Wajib ganti saat login pertama.');
                    setResetting(null);
                },
            },
        );
    };

    const handleChatWA = (u: UserRow) => {
        const url = buildWhatsAppLink(u.phone, buildResetMessage(u));
        window.open(url, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sub-Vendor Users" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-bold">Sub-Vendor Users</h1>
                    <p className="text-muted-foreground text-sm">User dengan role sub-vendor lintas vendor.</p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                    <Input
                        placeholder="Cari nama / email / phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
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
                    <Select value={filters?.sub_vendor_id || 'all'} onValueChange={(v) => updateFilter('sub_vendor_id', v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Semua sub-vendor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua sub-vendor</SelectItem>
                            {subVendors.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="submit" variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-4 py-3 text-left font-medium">Nama</th>
                                <th className="px-4 py-3 text-left font-medium">Kontak</th>
                                <th className="px-4 py-3 text-left font-medium">Vendor</th>
                                <th className="px-4 py-3 text-left font-medium">Sub-Vendor</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((u) => (
                                <tr key={u.id} className="hover:bg-muted/30 border-b transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {u.name}
                                            {u.must_change_password && (
                                                <Badge variant="outline" className="ml-2 text-xs text-amber-600">
                                                    belum ganti password
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs">{u.email}</div>
                                        <div className="text-muted-foreground text-xs">{u.phone}</div>
                                    </td>
                                    <td className="text-muted-foreground px-4 py-3 text-xs">{u.vendor?.name ?? '-'}</td>
                                    <td className="text-muted-foreground px-4 py-3 text-xs">{u.sub_vendor?.name ?? '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleChatWA(u)} title="Chat WhatsApp">
                                                <MessageCircle className="h-3 w-3" />
                                            </Button>
                                            <Link href={route('admin.users.edit', u.id)}>
                                                <Button variant="ghost" size="sm" title="Edit">
                                                    Edit
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

                    {users.data.length === 0 && <div className="text-muted-foreground py-12 text-center">Belum ada sub-vendor user.</div>}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleDelete}
                title="Hapus sub-vendor user"
                description={`Yakin ingin menghapus user "${deleting?.name}"?`}
            />

            <ConfirmDialog
                open={!!resetting}
                onOpenChange={(open) => !open && setResetting(null)}
                onConfirm={handleReset}
                title="Reset Password"
                description={`Reset password "${resetting?.name}" ke default "password"?`}
            >
                {resetting && (
                    <div className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleChatWA(resetting)} className="w-full">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Kirim instruksi via WhatsApp
                        </Button>
                    </div>
                )}
            </ConfirmDialog>
        </AppLayout>
    );
}
