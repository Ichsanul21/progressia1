import { FlashToaster } from '@/hooks/use-flash-toasts';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { Toaster } from 'sonner';

export default function AuthLayout({ children, title, description, ...props }: { children: React.ReactNode; title: string; description: string }) {
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
            <FlashToaster />
            <Toaster position="bottom-right" richColors closeButton />
        </AuthLayoutTemplate>
    );
}
