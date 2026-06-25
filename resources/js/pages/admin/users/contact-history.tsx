import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { History, Search, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/admin/users' },
    { title: 'Contact History', href: '/admin/users/contact-history' },
];

interface Entry {
    id: number;
    user_id: number;
    field: 'email' | 'phone';
    old_value: string | null;
    new_value: string | null;
    reason: string | null;
    changed_by_user_id: number | null;
    created_at: string;
    user: { id: number; name: string; email: string } | null;
    changed_by: { id: number; name: string } | null;
}

interface Props {
    entries: {
        data: Entry[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters?: { q?: string; field?: string; user_id?: string };
    targetUser?: { id: number; name: string; email: string; phone: string | null } | null;
}

export default function ContactHistoryIndex({ entries, filters, targetUser }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [q, setQ] = useState(filters?.q ?? '');
    const [field, setField] = useState(filters?.field ?? '');

    const apply = (next: Record<string, string | undefined> = {}) => {
        router.get(route('admin.users.contact-history'), { q, field, ...next }, { preserveState: true });
    };

    const clearTarget = () => {
        router.get(route('admin.users.contact-history'), { q, field }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contact History" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold">
                            <History className="h-5 w-5" />
                            Contact History
                        </h1>
                        <p className="text-muted-foreground text-sm">Riwayat perubahan email dan phone user. Backfilled saat migrasi.</p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {targetUser && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                        <div>
                            <div className="font-medium text-amber-900">Filter aktif: {targetUser.name}</div>
                            <div className="text-amber-800">
                                {targetUser.email}
                                {targetUser.phone ? ` · ${targetUser.phone}` : ''}
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearTarget}>
                            <X className="mr-1 h-3 w-3" />
                            Clear
                        </Button>
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply();
                    }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <Input placeholder="Cari email/phone/nama..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
                    <select
                        value={field}
                        onChange={(e) => {
                            setField(e.target.value);
                            apply({ field: e.target.value });
                        }}
                        className="border-input bg-background flex h-10 max-w-xs rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="">Semua field</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                    </select>
                    <Button variant="outline" size="sm" type="submit">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-4 py-3 text-left font-medium">When</th>
                                <th className="px-4 py-3 text-left font-medium">User</th>
                                <th className="px-4 py-3 text-left font-medium">Field</th>
                                <th className="px-4 py-3 text-left font-medium">From → To</th>
                                <th className="px-4 py-3 text-left font-medium">Reason</th>
                                <th className="px-4 py-3 text-left font-medium">By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.data.map((e) => (
                                <tr key={e.id} className="hover:bg-muted/30 border-b transition-colors">
                                    <td className="text-muted-foreground px-4 py-3 text-xs">{new Date(e.created_at).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3">
                                        {e.user ? (
                                            <Link
                                                href={route('admin.users.contact-history', { user_id: e.user.id })}
                                                className="font-medium hover:underline"
                                            >
                                                {e.user.name}
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground">deleted #{e.user_id}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={e.field === 'email' ? 'default' : 'secondary'}>{e.field}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <div className="text-muted-foreground line-through">{e.old_value ?? '—'}</div>
                                        <div className="font-medium">{e.new_value ?? '—'}</div>
                                    </td>
                                    <td className="text-muted-foreground px-4 py-3 text-xs">{e.reason ?? '—'}</td>
                                    <td className="text-muted-foreground px-4 py-3 text-xs">{e.changed_by?.name ?? 'system'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Pagination pagination={entries} />

                    {entries.data.length === 0 && (
                        <div className="text-muted-foreground py-12 text-center">
                            <p>Belum ada perubahan email/phone tercatat.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
