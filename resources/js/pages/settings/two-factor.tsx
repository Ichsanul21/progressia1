import { Head, router, useForm } from '@inertiajs/react';
import { LoaderCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Security settings', href: '/settings/two-factor' }];

interface TwoFactorProps {
    twoFactorEnabled: boolean;
    twoFactorConfirmed: boolean;
}

export default function TwoFactor({ twoFactorEnabled, twoFactorConfirmed }: TwoFactorProps) {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
    });

    const enable2FA = () => {
        setFetchError(null);
        router.post(
            '/user/two-factor-authentication',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    fetch('/user/two-factor-qr-code', { headers: { Accept: 'application/json' } })
                        .then((res) => {
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            return res.json();
                        })
                        .then((payload) => setQrCode(payload.svg))
                        .catch(() => setFetchError('Gagal memuat QR code. Coba ulangi.'));
                },
                onError: () => {},
            },
        );
    };

    const confirm2FA: FormEventHandler = (e) => {
        e.preventDefault();
        post('/user/confirmed-two-factor-authentication', {
            preserveScroll: true,
            onSuccess: () => {
                setQrCode(null);
                setRecoveryCodes(null);
                reset();
                router.reload();
            },
            onError: () => {},
        });
    };

    const disable2FA = () => {
        router.delete('/user/two-factor-authentication', {
            preserveScroll: true,
            onSuccess: () => {
                setQrCode(null);
                setRecoveryCodes(null);
                router.reload();
            },
            onError: () => {},
        });
    };

    const showCodes = () => {
        setFetchError(null);
        fetch('/user/two-factor-recovery-codes', { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((codes) => {
                setRecoveryCodes(codes);
                setShowRecoveryCodes(true);
            })
            .catch(() => setFetchError('Gagal memuat recovery codes. Coba ulangi.'));
    };

    const regenerateCodes = () => {
        router.post(
            '/user/two-factor-recovery-codes',
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setRecoveryCodes((page.recoveryCodes as string[]) ?? []);
                },
                onError: () => {},
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two-Factor Authentication" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Two-Factor Authentication" description="Add extra security to your account using TOTP authenticator apps" />

                    {fetchError && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{fetchError}</div>}

                    {twoFactorConfirmed ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-green-500" />
                                    <CardTitle className="text-base">Two-factor authentication is enabled</CardTitle>
                                </div>
                                <CardDescription>Your account is protected with two-factor authentication.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="outline" onClick={showCodes}>
                                    Show recovery codes
                                </Button>

                                {showRecoveryCodes && recoveryCodes && (
                                    <div className="space-y-2">
                                        <div className="bg-muted rounded-md p-3 font-mono text-sm">
                                            {recoveryCodes.map((code, i) => (
                                                <div key={i}>{code}</div>
                                            ))}
                                        </div>
                                        <p className="text-muted-foreground text-xs">
                                            Store these recovery codes somewhere safe. Each code can only be used once.
                                        </p>
                                        <Button variant="secondary" size="sm" onClick={regenerateCodes}>
                                            Regenerate codes
                                        </Button>
                                    </div>
                                )}

                                <Button variant="destructive" onClick={disable2FA}>
                                    <ShieldOff className="mr-2 h-4 w-4" />
                                    Disable two-factor authentication
                                </Button>
                            </CardContent>
                        </Card>
                    ) : twoFactorEnabled && qrCode ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Confirm two-factor authentication</CardTitle>
                                <CardDescription>
                                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the code below to
                                    confirm.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-center [&_svg]:max-w-[200px]" dangerouslySetInnerHTML={{ __html: qrCode }} />

                                <form onSubmit={confirm2FA} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="code">Authenticator code</Label>
                                        <Input
                                            id="code"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            placeholder="000000"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                        />
                                        <InputError message={errors.code} />
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirm
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Enable two-factor authentication</CardTitle>
                                <CardDescription>
                                    When two-factor authentication is enabled, you will be prompted for a secure, random token during authentication.
                                    You may retrieve this token from your phone's authenticator application.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={enable2FA}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Enable
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
