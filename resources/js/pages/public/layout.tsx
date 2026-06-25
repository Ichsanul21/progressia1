import { Head } from '@inertiajs/react';
import { useEffect, type ReactNode } from 'react';

import { forceLightMode, restoreLightMode } from '@/hooks/use-appearance';
import { Toaster } from 'sonner';

interface PublicLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
    useEffect(() => {
        forceLightMode();
        return () => restoreLightMode();
    }, []);

    return (
        <>
            {title && <Head title={title} />}
            <div className="force-light min-h-screen bg-slate-50">
                <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
            </div>
            <Toaster position="bottom-right" richColors closeButton />
        </>
    );
}
