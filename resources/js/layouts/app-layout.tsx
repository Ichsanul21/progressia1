import { FlashToaster } from '@/hooks/use-flash-toasts';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { Toaster } from 'sonner';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { auth } = usePage<SharedData>().props;
    const isClient = auth.user.role === 'client';

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {isClient && (
                <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                    <Eye className="h-4 w-4 shrink-0" />
                    <span>Anda masuk sebagai Client. Anda hanya dapat melihat proyek yang di-invite oleh vendor.</span>
                </div>
            )}
            {children}
            <FlashToaster />
            <Toaster position="bottom-right" richColors closeButton />
        </AppLayoutTemplate>
    );
};
