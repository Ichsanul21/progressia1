import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vendors', href: '/admin/vendors' }];

interface Vendor {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    users_count: number;
    created_at: string;
    deleted_at: string | null;
}

export default function VendorsIndex({
    vendors,
    filters,
    canDelete,
}: {
    vendors: {
        data: Vendor[];
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
    const [deleting, setDeleting] = useState<Vendor | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.vendors.index'), { search }, { preserveState: true });
    };

    const handleConfirmDelete = () => {
        if (!deleting) return;
        router.delete(route('admin.vendors.destroy', deleting.id), {
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vendors" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Vendors</h1>
                        <p className="text-muted-foreground text-sm">Manage all vendors in the system</p>
                    </div>
                    <Link href={route('admin.vendors.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Vendor
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    <Button variant="outline" size="sm" type="submit">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="space-y-4">
                    {vendors.data.map((vendor) => (
                        <Card key={vendor.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <CardTitle className="text-base">{vendor.name}</CardTitle>
                                            <p className="text-muted-foreground text-sm">
                                                {vendor.email ?? 'No email'} &middot; {vendor.phone ?? 'No phone'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={vendor.is_active ? 'default' : 'secondary'}>{vendor.is_active ? 'Active' : 'Inactive'}</Badge>
                                        <span className="text-muted-foreground text-sm">{vendor.users_count} users</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Link href={route('admin.vendors.edit', vendor.id)}>
                                        <Button variant="outline" size="sm">
                                            <Pencil className="mr-1 h-3 w-3" />
                                            Edit
                                        </Button>
                                    </Link>
                                    {canDelete && (
                                        <Button variant="destructive" size="sm" onClick={() => setDeleting(vendor)}>
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Pagination pagination={vendors} />

                    {vendors.data.length === 0 && (
                        <div className="text-muted-foreground py-12 text-center">
                            <p>No vendors found.</p>
                            <Link href={route('admin.vendors.create')} className="mt-2 inline-block text-sm underline">
                                Create your first vendor
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Vendor"
                description={`Yakin ingin menghapus vendor "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            />
        </AppLayout>
    );
}
