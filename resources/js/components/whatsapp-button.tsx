import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
    phone: string;
    message: string;
    label?: string;
    size?: 'sm' | 'default' | 'lg' | 'icon';
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function buildWhatsAppLink(phone: string, message: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppButton({ phone, message, label = 'Kirim via WhatsApp', size = 'sm', variant = 'outline' }: WhatsAppButtonProps) {
    if (!phone) return null;

    return (
        <Button asChild size={size} variant={variant}>
            <a href={buildWhatsAppLink(phone, message)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1 h-4 w-4" />
                {label}
            </a>
        </Button>
    );
}
