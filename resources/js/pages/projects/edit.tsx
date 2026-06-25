import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Plus, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TagInput from '@/components/tag-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Edit', href: '' },
];

interface Project {
    id: number;
    name: string;
    description: string | null;
    categories: string[] | null;
    tags: string[] | null;
    status: string;
    progress: number;
    cover_image: string | null;
    start_date: string | null;
    target_date: string | null;
    budget: number | null;
    vendor_id: number | null;
}

interface ClientOption {
    id: number;
    name: string;
    email: string;
    vendor_id: number | null;
}

export default function ProjectsEdit({
    project,
    vendors,
    allClients,
}: {
    project: Project;
    vendors: { id: number; name: string }[];
    allClients: ClientOption[];
}) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const isSuperAdmin = auth.user.role === 'super_admin';
    const [removeCover, setRemoveCover] = useState(false);
    const [clientMode, setClientMode] = useState<'none' | 'existing' | 'new'>('none');

    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        name: project.name,
        description: project.description ?? '',
        categories: project.categories ?? [],
        tags: project.tags ?? [],
        status: project.status,
        progress: project.progress.toString(),
        start_date: project.start_date?.slice(0, 10) ?? '',
        target_date: project.target_date?.slice(0, 10) ?? '',
        budget: project.budget?.toString() ?? '',
        cover_image: null as File | null,
        remove_cover_image: false,
        vendor_id: project.vendor_id?.toString() ?? '',
        client_id: '',
        new_client: { name: '', email: '', phone: '' },
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Reset client data berdasarkan mode sebelum submit
        if (clientMode === 'none') {
            setData('client_id', '');
            setData('new_client', { name: '', email: '', phone: '' });
        } else if (clientMode === 'existing') {
            setData('new_client', { name: '', email: '', phone: '' });
        }

        post(route('projects.update', project.id), {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Project" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Edit Project</h1>

                <form onSubmit={submit} className="space-y-4">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="text-base">{project.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>

                            {isSuperAdmin && (
                                <div className="grid gap-2">
                                    <Label htmlFor="vendor_id">Vendor</Label>
                                    <Select value={data.vendor_id} onValueChange={(v) => setData('vendor_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vendor..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vendors.map((v) => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.vendor_id} />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="done">Done</option>
                                </select>
                                <InputError message={errors.status} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="progress">Progress (%)</Label>
                                <Input
                                    id="progress"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={data.progress}
                                    onChange={(e) => setData('progress', e.target.value)}
                                />
                                <InputError message={errors.progress} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Categories</Label>
                                <TagInput value={data.categories} onChange={(v) => setData('categories', v)} placeholder="Add category..." />
                            </div>

                            <div className="grid gap-2">
                                <Label>Tags</Label>
                                <TagInput value={data.tags} onChange={(v) => setData('tags', v)} placeholder="Add tag..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">Start Date</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                    />
                                    <InputError message={errors.start_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="target_date">Target Date</Label>
                                    <Input
                                        id="target_date"
                                        type="date"
                                        value={data.target_date}
                                        onChange={(e) => setData('target_date', e.target.value)}
                                    />
                                    <InputError message={errors.target_date} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="budget">Budget (IDR)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={data.budget}
                                    onChange={(e) => setData('budget', e.target.value)}
                                    placeholder="100000000"
                                />
                                <InputError message={errors.budget} />
                            </div>

                            {project.cover_image && !removeCover && (
                                <div className="relative overflow-hidden rounded-lg border">
                                    <img src={`/storage/${project.cover_image}`} alt="" className="h-32 w-full object-cover" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => {
                                            setRemoveCover(true);
                                            setData('remove_cover_image', true);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="cover_image">{project.cover_image && !removeCover ? 'Change Cover Image' : 'Cover Image'}</Label>
                                <Input
                                    id="cover_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('cover_image', e.target.files?.[0] ?? null)}
                                />
                                <InputError message={errors.cover_image} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="text-base">Tambah Client</CardTitle>
                            <CardDescription>Invite client tambahan ke proyek ini (opsional). Tidak menghapus client yang sudah ada.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
                                    <input
                                        type="radio"
                                        name="client_mode"
                                        value="none"
                                        checked={clientMode === 'none'}
                                        onChange={() => setClientMode('none')}
                                    />
                                    <span>Tidak tambah</span>
                                </label>
                                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
                                    <input
                                        type="radio"
                                        name="client_mode"
                                        value="existing"
                                        checked={clientMode === 'existing'}
                                        onChange={() => setClientMode('existing')}
                                    />
                                    <span>Pilih client existing</span>
                                </label>
                                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
                                    <input
                                        type="radio"
                                        name="client_mode"
                                        value="new"
                                        checked={clientMode === 'new'}
                                        onChange={() => setClientMode('new')}
                                    />
                                    <span>Buat client baru</span>
                                </label>
                            </div>

                            {clientMode === 'existing' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="client_id">Client</Label>
                                    <Select value={data.client_id} onValueChange={(v) => setData('client_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih client..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allClients.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name} &middot; {c.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {allClients.length === 0 && <p className="text-muted-foreground text-xs">Belum ada client di vendor ini.</p>}
                                    <InputError message={errors.client_id} />
                                </div>
                            )}

                            {clientMode === 'new' && (
                                <div className="space-y-3 rounded-md border p-3">
                                    <p className="text-muted-foreground text-xs">
                                        Client baru akan dibuat dengan password default <code>password</code> dan wajib ganti password saat login
                                        pertama.
                                    </p>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new_client_name">Nama</Label>
                                        <Input
                                            id="new_client_name"
                                            value={data.new_client.name}
                                            onChange={(e) => setData('new_client', { ...data.new_client, name: e.target.value })}
                                        />
                                        <InputError message={errors['new_client.name']} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new_client_email">Email</Label>
                                        <Input
                                            id="new_client_email"
                                            type="email"
                                            value={data.new_client.email}
                                            onChange={(e) => setData('new_client', { ...data.new_client, email: e.target.value })}
                                        />
                                        <InputError message={errors['new_client.email']} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new_client_phone">No. WhatsApp (format +628xxxxxxxxx)</Label>
                                        <Input
                                            id="new_client_phone"
                                            value={data.new_client.phone}
                                            onChange={(e) => setData('new_client', { ...data.new_client, phone: e.target.value })}
                                            placeholder="+6281234567890"
                                        />
                                        <InputError message={errors['new_client.phone']} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex max-w-2xl justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" />
                            Update Project
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
