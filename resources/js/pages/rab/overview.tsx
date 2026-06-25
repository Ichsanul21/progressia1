import { Head, Link, router } from '@inertiajs/react';
import { Download, FileSpreadsheet, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'RAB', href: '/rab' }];

interface Project {
    id: number;
    name: string;
    vendor: { id: number; name: string } | null;
    rab_items_count: number;
    total_budget: number;
    total_realization: number;
}

interface Template {
    id: number;
    name: string;
    description: string | null;
    items_count: number;
    download_url: string;
}

export default function RabOverview({
    projects,
    templates,
    filters,
    vendors,
    canDelete,
}: {
    projects: {
        data: Project[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    templates: Template[];
    filters?: { search?: string; vendor_id?: string };
    vendors?: { id: number; name: string }[];
    canDelete?: boolean;
}) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [deleting, setDeleting] = useState<Template | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('rab.index'), { search }, { preserveState: true });
    };

    const handleConfirmDelete = () => {
        if (!deleting) return;
        router.delete(route('rab.templates.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const formatCurrency = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

    const projectProgress = (p: Project) => (p.total_budget > 0 ? Math.min(100, Math.round((p.total_realization / p.total_budget) * 100)) : 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="RAB" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-bold">RAB</h1>
                    <p className="text-muted-foreground text-sm">Rencana Anggaran Biaya — ringkasan per project dan template sistem</p>
                </div>

                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Projects</h2>

                    <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
                        <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                        {vendors && vendors.length > 0 && (
                            <select
                                value={filters?.vendor_id ?? ''}
                                onChange={(e) => router.get(route('rab.index'), { search, vendor_id: e.target.value }, { preserveState: true })}
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

                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="px-4 py-3 text-left font-medium">Project</th>
                                    <th className="px-4 py-3 text-left font-medium">Vendor</th>
                                    <th className="px-4 py-3 text-right font-medium">Items</th>
                                    <th className="px-4 py-3 text-right font-medium">Total Budget</th>
                                    <th className="px-4 py-3 text-right font-medium">Realization</th>
                                    <th className="px-4 py-3 text-left font-medium">Progress</th>
                                    <th className="px-4 py-3 text-right font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.data.map((p) => {
                                    const percent = projectProgress(p);
                                    return (
                                        <tr key={p.id} className="hover:bg-muted/30 border-b transition-colors">
                                            <td className="px-4 py-3 font-medium">{p.name}</td>
                                            <td className="text-muted-foreground px-4 py-3">{p.vendor?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-right">{p.rab_items_count}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(p.total_budget)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(p.total_realization)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-secondary h-2 w-24 rounded-full">
                                                        <div
                                                            className="bg-primary h-2 rounded-full transition-all"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-muted-foreground w-9 text-xs">{percent}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={route('projects.rab.index', p.id)}>
                                                    <Button variant="outline" size="sm">
                                                        <FileSpreadsheet className="mr-1 h-3 w-3" />
                                                        Open RAB
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <Pagination pagination={projects} />

                        {projects.data.length === 0 && (
                            <div className="text-muted-foreground py-12 text-center">
                                <p>No projects found.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">RAB Templates</h2>
                    <p className="text-muted-foreground text-sm">
                        Template Excel yang disediakan sistem. Download, isi volume & harga, lalu import ke project.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {templates.map((t) => (
                            <Card key={t.id}>
                                <CardHeader>
                                    <CardTitle className="text-base">{t.name}</CardTitle>
                                    {t.description && <CardDescription>{t.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-muted-foreground text-sm">
                                        {t.items_count} {t.items_count === 1 ? 'item' : 'items'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <a href={t.download_url} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Download className="mr-1 h-3 w-3" />
                                                Download Excel
                                            </Button>
                                        </a>
                                        {canDelete && (
                                            <Button variant="ghost" size="sm" onClick={() => setDeleting(t)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {templates.length === 0 && (
                        <div className="text-muted-foreground py-8 text-center">
                            <p>No templates available.</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus RAB Template"
                description={`Yakin ingin menghapus template "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            />
        </AppLayout>
    );
}
