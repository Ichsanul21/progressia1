import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WhatsAppButton } from '@/components/whatsapp-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Key, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Clients', href: '/admin/clients' }];

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    must_change_password: boolean;
    projects_as_client_count: number;
}

interface Props {
    clients: {
        data: Client[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters?: { search?: string; vendor_id?: string };
    vendors?: { id: number; name: string }[];
}

export default function AdminClientsIndex({ clients, filters, vendors }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [search, setSearch] = useState(filters?.search ?? '');
    const [deleting, setDeleting] = useState<Client | null>(null);
    const [resetting, setResetting] = useState<Client | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.clients.index'), { search }, { preserveState: true });
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

    const buildResetMessage = (c: Client) =>
        `Halo ${c.name}, password Progressia Anda sudah direset.\nEmail: ${c.email}\nPassword: password\nLogin: ${window.location.origin}/login\nWajib ganti password setelah login.`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Clients</h1>
                        <p className="text-muted-foreground text-sm">Manage client users for project assignments</p>
                    </div>
                    <Link href={route('admin.users.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Client
                        </Button>
                    </Link>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    {vendors && vendors.length > 0 && (
                        <select
                            value={filters?.vendor_id ?? ''}
                            onChange={(e) => router.get(route('admin.clients.index'), { search, vendor_id: e.target.value }, { preserveState: true })}
                            className="border-input bg-background flex h-10 max-w-xs rounded-md border px-3 py-2 text-sm"
                        >
                            <option value="">All vendors</option>
                            {vendors.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <Button variant="outline" size="sm" type="submit">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Phone</th>
                                <th className="px-4 py-3 text-center font-medium">Projects</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.data.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/30 border-b transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                        {c.name}
                                        {c.must_change_password && (
                                            <Badge variant="outline" className="ml-2 text-xs text-amber-600">
                                                belum ganti password
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="text-muted-foreground px-4 py-3">{c.email}</td>
                                    <td className="text-muted-foreground px-4 py-3">{c.phone}</td>
                                    <td className="px-4 py-3 text-center">{c.projects_as_client_count}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={route('admin.users.edit', c.id)}>
                                                <Button variant="ghost" size="sm">
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="sm" onClick={() => setResetting(c)} title="Reset password">
                                                <Key className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleting(c)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Pagination pagination={clients} />

                    {clients.data.length === 0 && (
                        <div className="text-muted-foreground py-12 text-center">
                            <p>No clients found.</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleDelete}
                title="Hapus Client"
                description={`Yakin ingin menghapus client "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
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
