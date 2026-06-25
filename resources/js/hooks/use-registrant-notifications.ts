import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface RegistrantEventPayload {
    id: number;
    name: string;
    email: string;
    phone: string;
    company_name: string;
    industry: string;
    created_at: string;
}

interface UseRegistrantNotificationsOptions {
    enabled: boolean;
    onNewRegistrant?: (payload: RegistrantEventPayload) => void;
}

export function useRegistrantNotifications({ enabled, onNewRegistrant }: UseRegistrantNotificationsOptions) {
    useEffect(() => {
        if (!enabled) return;
        if (typeof window === 'undefined' || !window.Echo) return;

        const channel = window.Echo.private('admin.registrants');

        const handler = (event: RegistrantEventPayload) => {
            onNewRegistrant?.(event);
            toast.success(`Pendaftar baru: ${event.name} (${event.company_name})`);
            router.reload({ only: ['pendingRegistrantsCount'] });
        };

        channel.listen('.registrant.submitted', handler);

        return () => {
            channel.stopListening('.registrant.submitted', handler);
            window.Echo.leave('admin.registrants');
        };
    }, [enabled, onNewRegistrant]);
}
