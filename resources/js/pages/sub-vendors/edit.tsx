import ConfirmDialog from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import { Textarea } from '@/components/ui/textarea';
import { UserAssignmentDialog } from '@/components/user-assignment-dialog';
import { WhatsAppButton } from '@/components/whatsapp-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sub-Vendors', href: '/admin/sub-vendors' },
    { title: 'Edit', href: '' },
];

interface Vendor {
    id: number;
    name: string;
}

interface SubVendor {
    id: number;
    vendor_id: number;
    name: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    contact_person: string | null;
    npwp: string | null;
    license_number: string | null;
    tags: string[] | null;
    is_active: boolean;
}

interface SubVendorUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    must_change_password: boolean;
}

interface Props {
    subVendor: SubVendor;
    vendors: Vendor[];
    users: SubVendorUser[];
}

export default function SubVendorsEdit({ subVendor, vendors, users }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isSuperAdmin = auth.user.role === 'super_admin';

    const [addOpen, setAddOpen] = useState(false);
    const [removing, setRemoving] = useState<SubVendorUser | null>(null);
    const [resetting, setResetting] = useState<SubVendorUser | null>(null);

    const { data, setData, put, processing, errors } = useForm({
        vendor_id: subVendor.vendor_id.toString(),
        name: subVendor.name,
        description: subVendor.description ?? '',
        phone: subVendor.phone ?? '',
        email: subVendor.email ?? '',
        address: subVendor.address ?? '',
        contact_person: subVendor.contact_person ?? '',
        npwp: subVendor.npwp ?? '',
        license_number: subVendor.license_number ?? '',
        tags: subVendor.tags ?? [],
        is_active: subVendor.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.sub-vendors.update', subVendor.id), { preserveScroll: true });
    };

    const handleRemove = () => {
        if (!removing) return;
        router.delete(route('admin.sub-vendors.users.detach', [subVendor.id, removing.id]), {
            preserveScroll: true,
            onSuccess: () => setRemoving(null),
        });
    };

    const handleReset = () => {
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

    const buildResetMessage = (u: SubVendorUser) =>
        `Halo ${u.name}, password Progressia Anda sudah direset.\nEmail: ${u.email}\nPassword: password\nLogin: ${window.location.origin}/login\nWajib ganti password setelah login.`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Sub-Vendor" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Edit Sub-Vendor</h1>

                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{subVendor.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                {isSuperAdmin && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="vendor_id">Vendor</Label>
                                        <select
                                            id="vendor_id"
                                            value={data.vendor_id}
                                            onChange={(e) => setData('vendor_id', e.target.value)}
                                            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                        >
                                            <option value="">Select vendor...</option>
                                            {vendors.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.vendor_id} />
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                        <InputError message={errors.phone} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                        <InputError message={errors.email} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} rows={2} />
                                    <InputError message={errors.address} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="contact_person">Contact Person</Label>
                                        <Input
                                            id="contact_person"
                                            value={data.contact_person}
                                            onChange={(e) => setData('contact_person', e.target.value)}
                                        />
                                        <InputError message={errors.contact_person} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="npwp">NPWP</Label>
                                        <Input id="npwp" value={data.npwp} onChange={(e) => setData('npwp', e.target.value)} />
                                        <InputError message={errors.npwp} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="license_number">License Number</Label>
                                    <Input
                                        id="license_number"
                                        value={data.license_number}
                                        onChange={(e) => setData('license_number', e.target.value)}
                                    />
                                    <InputError message={errors.license_number} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tags">Tags</Label>
                                    <TagInput
                                        value={data.tags}
                                        onChange={(tags) => setData('tags', tags)}
                                        placeholder="Type and press Enter to add tags..."
                                    />
                                    <InputError message={errors.tags} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>

                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Sub-Vendor
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Users Sub-Vendor</CardTitle>
                            <Button size="sm" onClick={() => setAddOpen(true)}>
                                <Plus className="mr-1 h-3 w-3" />
                                Tambah
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {users.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Belum ada user untuk sub-vendor ini.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {users.map((u) => (
                                        <li key={u.id} className="rounded border p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {u.name}
                                                        {u.must_change_password && (
                                                            <Badge variant="outline" className="ml-2 text-xs text-amber-600">
                                                                belum ganti password
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">{u.email}</div>
                                                    <div className="text-muted-foreground text-xs">{u.phone}</div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => setRemoving(u)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="mt-2 flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => setResetting(u)}>
                                                    Reset password
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <UserAssignmentDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                title="Tambah user sub-vendor"
                description="Buat akun baru atau pilih user existing dalam vendor ini."
                createUrl={route('admin.users.store')}
                pickUrl={route('admin.sub-vendors.users.attach', subVendor.id)}
                searchUrl={route('admin.users.search')}
                role="sub_vendor"
                extraData={{ vendor_id: subVendor.vendor_id, sub_vendor_id: subVendor.id }}
                excludeIds={users.map((u) => u.id)}
            />

            <ConfirmDialog
                open={!!removing}
                onOpenChange={(open) => !open && setRemoving(null)}
                onConfirm={handleRemove}
                title="Lepas user"
                description={`Lepas "${removing?.name}" dari sub-vendor ini? User tidak terhapus, tapi tidak lagi terhubung ke sub-vendor.`}
                confirmText="Lepas"
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
                        <WhatsAppButton phone={resetting.phone} message={buildResetMessage(resetting)} label="Kirim instruksi via WhatsApp" />
                    </div>
                )}
            </ConfirmDialog>
        </AppLayout>
    );
}
