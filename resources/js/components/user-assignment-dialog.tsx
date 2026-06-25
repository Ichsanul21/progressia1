import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

export interface UserOption {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    role?: string | null;
}

type Mode = 'create' | 'pick';

interface UserAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    createUrl: string;
    pickUrl?: string;
    searchUrl: string;
    role: string;
    extraData?: Record<string, string | number | null | undefined>;
    excludeIds?: number[];
    onSuccess?: (user?: UserOption) => void;
}

export function UserAssignmentDialog({
    open,
    onOpenChange,
    title = 'Tambah user',
    description = 'Buat akun baru atau pilih user yang sudah ada.',
    createUrl,
    pickUrl,
    searchUrl,
    role,
    extraData = {},
    excludeIds = [],
    onSuccess,
}: UserAssignmentDialogProps) {
    const [mode, setMode] = useState<Mode>('create');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({ name: '', email: '', phone: '' });

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    useEffect(() => {
        if (!open) {
            setMode('create');
            setForm({ name: '', email: '', phone: '' });
            setQuery('');
            setResults([]);
            setSelectedUserId(null);
            setErrors({});
            setSubmitting(false);
        }
    }, [open]);

    useEffect(() => {
        if (mode !== 'pick' || query.length < 2) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        setSearching(true);

        const params = new URLSearchParams({ q: query, role });
        excludeIds.forEach((id) => params.append('exclude[]', String(id)));

        fetch(`${searchUrl}?${params.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then((data: UserOption[]) => {
                setResults(data);
                setSearching(false);
            })
            .catch(() => setSearching(false));

        return () => controller.abort();
    }, [query, mode, role, searchUrl, excludeIds]);

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        router.post(
            createUrl,
            { ...form, role, ...extraData },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    onOpenChange(false);
                    onSuccess?.();
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    setSubmitting(false);
                },
            },
        );
    };

    const submitPick = () => {
        if (!selectedUserId || !pickUrl) return;
        setSubmitting(true);

        router.post(
            pickUrl,
            { user_id: selectedUserId, ...extraData },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    onOpenChange(false);
                    onSuccess?.(results.find((r) => r.id === selectedUserId));
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    setSubmitting(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {pickUrl && (
                    <div className="flex gap-2">
                        <Button type="button" size="sm" variant={mode === 'create' ? 'default' : 'outline'} onClick={() => setMode('create')}>
                            Buat baru
                        </Button>
                        <Button type="button" size="sm" variant={mode === 'pick' ? 'default' : 'outline'} onClick={() => setMode('pick')}>
                            Pilih existing
                        </Button>
                    </div>
                )}

                {mode === 'create' && (
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama</Label>
                            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                            {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Nomor WhatsApp</Label>
                            <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                            <p className="text-muted-foreground text-xs">Contoh: 8123456789 (tanpa awalan 0 atau 62)</p>
                            {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
                        </div>
                        <p className="text-muted-foreground bg-muted rounded px-3 py-2 text-xs">
                            Password awal: <code className="font-mono">password</code>. User wajib ganti saat login pertama.
                        </p>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                                Buat akun
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {mode === 'pick' && pickUrl && (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="search">Cari berdasarkan nama atau email</Label>
                            <Input
                                id="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Minimal 2 karakter..."
                                autoFocus
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto rounded border">
                            {searching && <p className="text-muted-foreground p-3 text-sm">Mencari...</p>}
                            {!searching && query.length >= 2 && results.length === 0 && (
                                <p className="text-muted-foreground p-3 text-sm">Tidak ada hasil.</p>
                            )}
                            {!searching && query.length < 2 && <p className="text-muted-foreground p-3 text-sm">Ketik minimal 2 karakter.</p>}
                            {results.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => setSelectedUserId(u.id)}
                                    className={`hover:bg-accent w-full border-b p-2 text-left text-sm last:border-b-0 ${
                                        selectedUserId === u.id ? 'bg-accent' : ''
                                    }`}
                                >
                                    <div className="font-medium">{u.name}</div>
                                    <div className="text-muted-foreground text-xs">{u.email}</div>
                                </button>
                            ))}
                        </div>

                        {errors.user_id && <p className="text-destructive text-xs">{errors.user_id}</p>}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button type="button" disabled={!selectedUserId || submitting} onClick={submitPick}>
                                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                                Tambahkan
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
