import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sub-Vendors', href: '/admin/sub-vendors' },
    { title: 'Create', href: '/admin/sub-vendors/create' },
];

interface Vendor {
    id: number;
    name: string;
}

export default function SubVendorsCreate({ vendors }: { vendors: Vendor[] }) {
    const { auth } = usePage<SharedData>().props;
    const isSuperAdmin = auth.user.role === 'super_admin';

    const { data, setData, post, processing, errors } = useForm({
        vendor_id: isSuperAdmin ? '' : (auth.user.vendor_id ?? ''),
        name: '',
        description: '',
        phone: '',
        email: '',
        address: '',
        contact_person: '',
        npwp: '',
        license_number: '',
        tags: [] as string[],
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.sub-vendors.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Sub-Vendor" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Create Sub-Vendor</h1>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">Sub-Vendor Details</CardTitle>
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
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Sub-vendor name" />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Description"
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+62xxx" />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="subvendor@example.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Street address"
                                    rows={2}
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_person">Contact Person</Label>
                                    <Input
                                        id="contact_person"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        placeholder="PIC name"
                                    />
                                    <InputError message={errors.contact_person} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="npwp">NPWP</Label>
                                    <Input
                                        id="npwp"
                                        value={data.npwp}
                                        onChange={(e) => setData('npwp', e.target.value)}
                                        placeholder="XX.XXX.XXX.X-XXX.XXX"
                                    />
                                    <InputError message={errors.npwp} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="license_number">License Number</Label>
                                <Input
                                    id="license_number"
                                    value={data.license_number}
                                    onChange={(e) => setData('license_number', e.target.value)}
                                    placeholder="SIUJK / NIB"
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
                                Create Sub-Vendor
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
