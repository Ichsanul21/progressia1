import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, FileSpreadsheet, LoaderCircle, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import ConfirmDialog from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'RAB', href: '' },
];

interface RabItem {
    id: number;
    code: string | null;
    name: string;
    description: string | null;
    unit: string;
    volume: number;
    unit_price: number;
    realization: number;
    sort_order: number;
    phase: { id: number; name: string } | null;
    total: number;
}

interface Phase {
    id: number;
    name: string;
}

export default function RabIndex({
    project,
    items,
    phases,
    totalBudget,
    totalRealization,
    canDelete,
}: {
    project: { id: number; name: string; phases_count: number; tasks_count: number; documents_count: number };
    items: RabItem[];
    phases: Phase[];
    totalBudget: number;
    totalRealization: number;
    canDelete?: boolean;
}) {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<RabItem | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [deleting, setDeleting] = useState<RabItem | null>(null);
    const [importSummary, setImportSummary] = useState<{ imported: number; errors: string[] } | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: '',
        name: '',
        description: '',
        unit: '',
        volume: '',
        unit_price: '',
        phase_id: '',
    });

    const {
        setData: setImportData,
        post: importPost,
        processing: importProcessing,
        errors: importErrors,
        reset: importReset,
    } = useForm({
        file: null as File | null,
    });

    const openCreate = () => {
        reset();
        setEditingItem(null);
        setShowForm(true);
    };

    const openEdit = (item: RabItem) => {
        setEditingItem(item);
        setData({
            code: item.code ?? '',
            name: item.name,
            description: item.description ?? '',
            unit: item.unit,
            volume: String(item.volume),
            unit_price: String(item.unit_price),
            phase_id: item.phase?.id ? String(item.phase.id) : '',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingItem(null);
        reset();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const payload = {
            ...data,
            volume: parseFloat(data.volume) || 0,
            unit_price: parseFloat(data.unit_price) || 0,
            phase_id: data.phase_id ? parseInt(data.phase_id) : undefined,
        };

        if (editingItem) {
            put(route('projects.rab.update', [project.id, editingItem.id]), {
                data: payload,
                preserveScroll: true,
                onSuccess: closeForm,
            });
        } else {
            post(route('projects.rab.store', project.id), {
                data: payload,
                preserveScroll: true,
                onSuccess: closeForm,
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleting) return;
        router.delete(route('projects.rab.destroy', [project.id, deleting.id]), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const handleImport: FormEventHandler = (e) => {
        e.preventDefault();
        importPost(route('projects.rab.import', project.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                importReset();
                setShowImport(false);
                const flash = (page.props as { flash?: { success?: string } }).flash?.success ?? '';
                const importedMatch = flash.match(/(\d+)\s+items\s+imported/);
                const imported = importedMatch ? parseInt(importedMatch[1], 10) : 0;
                const errorPart = flash.includes('Errors:') ? flash.split('Errors:')[1].trim() : '';
                const errors = errorPart ? [errorPart] : [];
                setImportSummary({ imported, errors });
            },
        });
    };

    const itemTotal = (item: RabItem) => item.volume * item.unit_price;
    const remaining = totalBudget - totalRealization;
    const progressPercent = totalBudget > 0 ? Math.round((totalRealization / totalBudget) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`RAB - ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={route('projects.show', project.id)}>
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold">RAB - {project.name}</h1>
                        <p className="text-muted-foreground text-sm">Rencana Anggaran Biaya</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                            <Upload className="mr-1 h-3 w-3" />
                            Import Excel
                        </Button>
                        <Link href={route('projects.rab.export-template', project.id)}>
                            <Button variant="outline" size="sm">
                                <Download className="mr-1 h-3 w-3" />
                                Template
                            </Button>
                        </Link>
                        <a href={route('projects.rab.export', project.id)}>
                            <Button variant="outline" size="sm">
                                <FileSpreadsheet className="mr-1 h-3 w-3" />
                                Export
                            </Button>
                        </a>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm">Total Budget</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">Rp {totalBudget.toLocaleString('id-ID')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm">Realization</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">Rp {totalRealization.toLocaleString('id-ID')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm">Remaining</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : ''}`}>Rp {remaining.toLocaleString('id-ID')}</p>
                            <div className="bg-secondary mt-2 h-2 w-full rounded-full">
                                <div
                                    className={`h-2 rounded-full transition-all ${remaining < 0 ? 'bg-red-500' : 'bg-primary'}`}
                                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {showImport && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Import from Excel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {importSummary && (
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <Badge variant={importSummary.errors.length ? 'warning' : 'success'}>
                                        {importSummary.imported} items imported
                                    </Badge>
                                    {importSummary.errors.map((err, i) => (
                                        <Badge key={i} variant="destructive" className="text-xs">
                                            {err}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={handleImport} className="space-y-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="import-file">Excel file (.xlsx, .xls, .csv)</Label>
                                    <Input
                                        id="import-file"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => setImportData('file', e.target.files?.[0] ?? null)}
                                    />
                                    <InputError message={importErrors.file} />
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    Format: code, name, unit, volume, unit_price. Download template for reference.
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button type="submit" size="sm" disabled={importProcessing}>
                                        {importProcessing ? (
                                            <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                        ) : (
                                            <Upload className="mr-1 h-3 w-3" />
                                        )}
                                        Import
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowImport(false);
                                            importReset();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {showForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{editingItem ? 'Edit' : 'Add'} RAB Item</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="grid gap-1">
                                    <Label htmlFor="code">Code</Label>
                                    <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="e.g. 1.1" />
                                    <InputError message={errors.code} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Work item name"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="unit">Unit *</Label>
                                    <Input
                                        id="unit"
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                        placeholder="m2, m3, ls, unit"
                                    />
                                    <InputError message={errors.unit} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="volume">Volume *</Label>
                                    <Input
                                        id="volume"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.volume}
                                        onChange={(e) => setData('volume', e.target.value)}
                                        placeholder="0"
                                    />
                                    <InputError message={errors.volume} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="unit_price">Unit Price *</Label>
                                    <Input
                                        id="unit_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.unit_price}
                                        onChange={(e) => setData('unit_price', e.target.value)}
                                        placeholder="0"
                                    />
                                    <InputError message={errors.unit_price} />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="phase_id">Phase</Label>
                                    <select
                                        id="phase_id"
                                        value={data.phase_id}
                                        onChange={(e) => setData('phase_id', e.target.value)}
                                        className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                                    >
                                        <option value="">No phase</option>
                                        {phases.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.phase_id} />
                                </div>
                                <div className="grid gap-1 sm:col-span-2 lg:col-span-3">
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="border-input bg-background flex h-20 w-full rounded-md border px-3 py-2 text-sm"
                                        placeholder="Optional description..."
                                    />
                                    <InputError message={errors.description} />
                                </div>
                                <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
                                    <Button type="submit" size="sm" disabled={processing}>
                                        {processing ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : null}
                                        {editingItem ? 'Update' : 'Create'}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={closeForm}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-4 py-3 text-left font-medium">Code</th>
                                <th className="px-4 py-3 text-left font-medium">Item</th>
                                <th className="px-4 py-3 text-left font-medium">Phase</th>
                                <th className="px-4 py-3 text-left font-medium">Unit</th>
                                <th className="px-4 py-3 text-right font-medium">Volume</th>
                                <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                                <th className="px-4 py-3 text-right font-medium">Total</th>
                                <th className="px-4 py-3 text-right font-medium">Realization</th>
                                <th className="px-4 py-3 text-center font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30 border-b transition-colors">
                                    <td className="text-muted-foreground px-4 py-3">{item.code ?? '-'}</td>
                                    <td className="px-4 py-3 font-medium">{item.name}</td>
                                    <td className="text-muted-foreground px-4 py-3">{item.phase?.name ?? '-'}</td>
                                    <td className="px-4 py-3">{item.unit}</td>
                                    <td className="px-4 py-3 text-right">{item.volume.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right">Rp {item.unit_price.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right font-medium">Rp {itemTotal(item).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right">
                                        {item.realization > 0 ? `Rp ${item.realization.toLocaleString('id-ID')}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            {canDelete && (
                                                <Button variant="ghost" size="sm" onClick={() => setDeleting(item)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t font-medium">
                                <td colSpan={6} className="px-4 py-3 text-right">
                                    Grand Total
                                </td>
                                <td className="px-4 py-3 text-right">Rp {totalBudget.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right">Rp {totalRealization.toLocaleString('id-ID')}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>

                    {items.length === 0 && (
                        <div className="text-muted-foreground py-12 text-center">
                            <p>No RAB items yet.</p>
                            <Button variant="link" onClick={openCreate} className="mt-2">
                                Add your first item
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Item RAB"
                description={`Yakin ingin menghapus item RAB "${deleting?.name}"?`}
            />
        </AppLayout>
    );
}
