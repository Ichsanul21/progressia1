import { router } from '@inertiajs/react';
import { Lock, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PublicLayout from '@/pages/public/layout';

interface PublicPasswordProps {
    token: string;
    errors?: { password?: string };
}

export default function PublicPassword({ token, errors }: PublicPasswordProps) {
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            `/r/${token}`,
            { password },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <PublicLayout title="Laporan Progress">
            <div className="flex min-h-[60vh] items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">Laporan Progress Proyek</CardTitle>
                        <CardDescription>Masukkan password untuk membuka laporan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-8"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <InputError message={errors?.password} />
                            </div>
                            <Button type="submit" className="w-full" disabled={submitting || !password}>
                                Buka Laporan
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PublicLayout>
    );
}
