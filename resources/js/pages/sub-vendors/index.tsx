import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Sub-Vendors', href: '/admin/sub-vendors' }];

interface SubVendor {
    id: number;
    name: string;
    description: string | null;
    tags: string[] | null;
    is_active: boolean;
    vendor: { id: number; name: string } | null;
    created_at: string;
}

export default function SubVendorsIndex({
    subVendors,
    filters,
    canDelete,
}: {
    subVendors: {
        data: SubVendor[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters?: { search?: string };
    canDelete?: boolean;
}) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [deleting, setDeleting] = useState<SubVendor | null>(null);
    const isSuperAdmin = usePage<SharedData>().props.auth.user.role === 'super_admin';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.sub-vendors.index'), { search }, { preserveState: true });
    };

    const handleConfirmDelete = () => {
        if (!deleting) return;
        router.delete(route('admin.sub-vendors.destroy', deleting.id), {
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sub-Vendors" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Sub-Vendors</h1>
                        <p className="text-muted-foreground text-sm">Manage sub-vendors and categories</p>
                    </div>
                    <Link href={route('admin.sub-vendors.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Sub-Vendor
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input placeholder="Search sub-vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    <Button variant="outline" size="sm" type="submit">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="space-y-4">
                    {subVendors.data.map((sv) => (
                        <Card key={sv.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">{sv.name}</CardTitle>
                                        <p className="text-muted-foreground text-sm">
                                            {sv.vendor?.name ?? 'Unknown vendor'}
                                            {sv.description && ` — ${sv.description}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={sv.is_active ? 'default' : 'secondary'}>{sv.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1">
                                        {sv.tags?.map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-sm">{sv.vendor?.name ?? '—'}</span>
                                        {isSuperAdmin && (
                                            <Link href={route('admin.sub-vendors.edit', sv.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Pencil className="mr-1 h-3 w-3" />
                                                    Edit
                                                </Button>
                                            </Link>
                                        )}
                                        {canDelete && isSuperAdmin && (
                                            <Button variant="destructive" size="sm" onClick={() => setDeleting(sv)}>
                                                <Trash2 className="mr-1 h-3 w-3" />
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Pagination pagination={subVendors} />

                    {subVendors.data.length === 0 && (
                        <div className="text-muted-foreground py-12 text-center">
                            <p>No sub-vendors found.</p>
                            <Link href={route('admin.sub-vendors.create')} className="mt-2 inline-block text-sm underline">
                                Create your first sub-vendor
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Sub-Vendor"
                description={`Yakin ingin menghapus sub-vendor "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            />
        </AppLayout>
    );
}
