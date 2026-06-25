import InputError from '@/components/input-error';
import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/admin/users' },
    { title: 'Create', href: '/admin/users/create' },
];

const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin_vendor: 'Admin Vendor',
    project_manager: 'Project Manager',
    team: 'Team',
    client: 'Client',
    sub_vendor: 'Sub-Vendor',
};

interface Vendor {
    id: number;
    name: string;
}

interface SubVendor {
    id: number;
    name: string;
    vendor_id: number;
}

interface Props {
    vendors: Vendor[];
    subVendors: SubVendor[];
    allowedRoles: string[];
}

export default function AdminUsersCreate({ vendors, subVendors, allowedRoles }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        role: '',
        vendor_id: '',
        sub_vendor_id: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => reset('name', 'email', 'phone', 'role', 'sub_vendor_id'),
        });
    };

    const filteredSubVendors = data.vendor_id ? subVendors.filter((s) => String(s.vendor_id) === data.vendor_id) : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat User" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <Link href={route('admin.users.index')}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-bold">Buat User</h1>
                    <p className="text-muted-foreground text-sm">Password awal: password. User wajib ganti saat login pertama.</p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">Detail User</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Nomor WhatsApp</Label>
                                <PhoneInput value={data.phone} onChange={(v) => setData('phone', v)} />
                                <p className="text-muted-foreground text-xs">Contoh: 8123456789 (tanpa awalan 0 atau 62)</p>
                                <InputError message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(v) => {
                                        setData('role', v);
                                        if (v !== 'sub_vendor') setData('sub_vendor_id', '');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allowedRoles.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {roleLabels[r] ?? r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.role} />
                            </div>

                            {data.role !== 'super_admin' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="vendor_id">Vendor</Label>
                                    <Select value={data.vendor_id} onValueChange={(v) => setData('vendor_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih vendor..." />
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

                            {data.role === 'sub_vendor' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="sub_vendor_id">Sub-Vendor</Label>
                                    <Select value={data.sub_vendor_id} onValueChange={(v) => setData('sub_vendor_id', v)} disabled={!data.vendor_id}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={data.vendor_id ? 'Pilih sub-vendor...' : 'Pilih vendor dulu'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredSubVendors.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.sub_vendor_id} />
                                </div>
                            )}

                            <Button type="submit" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Buat User
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
