import InputError from '@/components/input-error';
import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface RegisterPageProps {
    industries: Record<string, string>;
    teamSizes: Record<string, string>;
    sources: Record<string, string>;
    [key: string]: unknown;
}

export default function Register() {
    const { props, flash } = usePage<{ props: RegisterPageProps; flash: { success?: string } }>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        industry: '',
        team_size: '',
        source: '',
        message: '',
        website: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            preserveScroll: true,
            onSuccess: () => reset('name', 'email', 'phone', 'company_name', 'industry', 'team_size', 'source', 'message'),
        });
    };

    if (flash.success) {
        return (
            <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6">
                <Head title="Pendaftaran Terkirim" />
                <div className="max-w-md text-center">
                    <CheckCircle2 className="text-primary mx-auto h-12 w-12" />
                    <h1 className="text-foreground mt-6 text-2xl font-semibold">Pendaftaran terkirim</h1>
                    <p className="text-muted-foreground mt-3 leading-relaxed">
                        Tim kami akan menghubungi Anda via WhatsApp dalam 1x24 jam untuk proses onboarding.
                    </p>
                    <Button asChild className="mt-8">
                        <Link href={route('home')}>Kembali ke beranda</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <Head title="Daftar Progressia" />

            <div className="w-full max-w-2xl">
                <div className="mb-8 text-center">
                    <Link href={route('home')} className="inline-block">
                        <span className="font-display text-2xl">Progressia.</span>
                    </Link>
                    <h1 className="text-foreground mt-4 text-2xl font-semibold">Daftar sebagai vendor</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Isi form di bawah. Tim kami akan menghubungi via WhatsApp untuk konfirmasi dan pembuatan akun.
                    </p>
                </div>

                <form onSubmit={submit} className="border-border bg-card rounded-2xl border p-6 shadow-sm md:p-8">
                    <div className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Anda</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                                <InputError message={errors.email} />
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Nomor WhatsApp</Label>
                                <PhoneInput value={data.phone} onChange={(v) => setData('phone', v)} />
                                <p className="text-muted-foreground text-xs">Contoh: 8123456789 (tanpa +62)</p>
                                <InputError message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="company_name">Nama Perusahaan</Label>
                                <Input
                                    id="company_name"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.company_name} />
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="industry">Industri</Label>
                                <Select value={data.industry} onValueChange={(v) => setData('industry', v)}>
                                    <SelectTrigger id="industry">
                                        <SelectValue placeholder="Pilih industri..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(props.industries).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.industry} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="team_size">Ukuran Tim</Label>
                                <Select value={data.team_size} onValueChange={(v) => setData('team_size', v)}>
                                    <SelectTrigger id="team_size">
                                        <SelectValue placeholder="Pilih ukuran tim..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(props.teamSizes).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.team_size} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="source">Dari mana Anda tahu Progressia?</Label>
                            <Select value={data.source} onValueChange={(v) => setData('source', v)}>
                                <SelectTrigger id="source">
                                    <SelectValue placeholder="Pilih sumber..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(props.sources).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>
                                            {v}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.source} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="message">Pesan tambahan (opsional)</Label>
                            <Textarea
                                id="message"
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                                rows={4}
                                placeholder="Ceritakan kebutuhan Anda, jenis project, atau pertanyaan onboarding..."
                            />
                            <InputError message={errors.message} />
                        </div>

                        <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
                            <label htmlFor="website">Website (jangan diisi)</label>
                            <input
                                id="website"
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                value={data.website}
                                onChange={(e) => setData('website', e.target.value)}
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Kirim Pendaftaran
                        </Button>

                        <p className="text-muted-foreground text-center text-xs">
                            Sudah punya akun?{' '}
                            <Link href={route('login')} className="text-foreground font-medium underline-offset-4 hover:underline">
                                Login di sini
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
