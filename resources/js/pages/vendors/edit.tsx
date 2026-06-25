import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Vendors', href: '/admin/vendors' },
    { title: 'Edit', href: '' },
];

const PROVINCES = [
    'Aceh',
    'Bali',
    'Banten',
    'Bengkulu',
    'DI Yogyakarta',
    'DKI Jakarta',
    'Gorontalo',
    'Jambi',
    'Jawa Barat',
    'Jawa Tengah',
    'Jawa Timur',
    'Kalimantan Barat',
    'Kalimantan Selatan',
    'Kalimantan Tengah',
    'Kalimantan Timur',
    'Kalimantan Utara',
    'Kepulauan Bangka Belitung',
    'Kepulauan Riau',
    'Lampung',
    'Maluku',
    'Maluku Utara',
    'Nusa Tenggara Barat',
    'Nusa Tenggara Timur',
    'Papua',
    'Papua Barat',
    'Papua Barat Daya',
    'Papua Pegunungan',
    'Papua Selatan',
    'Papua Tengah',
    'Riau',
    'Sulawesi Barat',
    'Sulawesi Selatan',
    'Sulawesi Tengah',
    'Sulawesi Tenggara',
    'Sulawesi Utara',
    'Sumatera Barat',
    'Sumatera Selatan',
    'Sumatera Utara',
];

const LANGUAGES = [
    { value: 'id', label: 'Indonesia' },
    { value: 'en', label: 'English' },
];

const TIMEZONES = ['Asia/Jakarta', 'Asia/Pontianak', 'Asia/Makassar', 'Asia/Jayapura'];

interface Vendor {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    contact_phone: string | null;
    contact_person: string | null;
    website: string | null;
    address: string | null;
    description: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    npwp: string | null;
    license_number: string | null;
    established_year: number | null;
    default_lang: string;
    timezone: string;
    logo: string | null;
    is_active: boolean;
}

export default function VendorsEdit({ vendor }: { vendor: Vendor }) {
    const { data, setData, put, processing, errors } = useForm({
        name: vendor.name,
        logo: '' as string | File,
        description: vendor.description ?? '',
        email: vendor.email ?? '',
        phone: vendor.phone ?? '',
        contact_phone: vendor.contact_phone ?? '',
        contact_person: vendor.contact_person ?? '',
        website: vendor.website ?? '',
        address: vendor.address ?? '',
        city: vendor.city ?? '',
        province: vendor.province ?? '',
        postal_code: vendor.postal_code ?? '',
        npwp: vendor.npwp ?? '',
        license_number: vendor.license_number ?? '',
        established_year: vendor.established_year?.toString() ?? '',
        default_lang: vendor.default_lang,
        timezone: vendor.timezone,
        is_active: vendor.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.vendors.update', vendor.id), {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Vendor" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Edit Vendor</h1>

                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle className="text-base">{vendor.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">
                            <div className="grid gap-2">
                                <Label htmlFor="logo">Logo</Label>
                                {vendor.logo && (
                                    <div className="mb-2">
                                        <img src={`/storage/${vendor.logo}`} alt={vendor.name} className="h-16 w-16 rounded-lg object-cover" />
                                    </div>
                                )}
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setData('logo', file);
                                    }}
                                />
                                <InputError message={errors.logo} />
                            </div>

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
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        placeholder="https://example.com"
                                    />
                                    <InputError message={errors.website} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_phone">Contact Phone</Label>
                                    <Input id="contact_phone" value={data.contact_phone} onChange={(e) => setData('contact_phone', e.target.value)} />
                                    <InputError message={errors.contact_phone} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="contact_person">Contact Person</Label>
                                <Input id="contact_person" value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} />
                                <InputError message={errors.contact_person} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} rows={2} />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                                    <InputError message={errors.city} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="province">Province</Label>
                                    <Select value={data.province} onValueChange={(v) => setData('province', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select province..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROVINCES.map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.province} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="postal_code">Postal Code</Label>
                                    <Input id="postal_code" value={data.postal_code} onChange={(e) => setData('postal_code', e.target.value)} />
                                    <InputError message={errors.postal_code} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="npwp">NPWP</Label>
                                    <Input id="npwp" value={data.npwp} onChange={(e) => setData('npwp', e.target.value)} />
                                    <InputError message={errors.npwp} />
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
                                    <Label htmlFor="established_year">Established Year</Label>
                                    <Input
                                        id="established_year"
                                        type="number"
                                        min={1900}
                                        max={new Date().getFullYear()}
                                        value={data.established_year}
                                        onChange={(e) => setData('established_year', e.target.value)}
                                    />
                                    <InputError message={errors.established_year} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="default_lang">Default Language</Label>
                                    <Select value={data.default_lang} onValueChange={(v) => setData('default_lang', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGES.map((l) => (
                                                <SelectItem key={l.value} value={l.value}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.default_lang} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select value={data.timezone} onValueChange={(v) => setData('timezone', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIMEZONES.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.timezone} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox id="is_active" checked={data.is_active} onCheckedChange={(c) => setData('is_active', c === true)} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>

                            <Button type="submit" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Update Vendor
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
