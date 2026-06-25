import { cn } from '@/lib/utils';
import * as React from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: string;
    onChange: (value: string) => void;
}

function stripPrefix(value: string): string {
    return value.replace(/^\+62/, '').replace(/\D/g, '');
}

function applyPrefix(local: string): string {
    return local ? `+62${local}` : '';
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(({ value, onChange, className, ...props }, ref) => {
    const local = stripPrefix(value || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').replace(/^0+/, '').replace(/^62/, '');
        onChange(applyPrefix(digits));
    };

    return (
        <div
            className={cn(
                'border-input bg-background ring-offset-background focus-within:ring-ring flex h-10 w-full items-center overflow-hidden rounded-md border text-sm focus-within:ring-2 focus-within:ring-offset-2',
                className,
            )}
        >
            <span className="bg-muted text-muted-foreground border-input flex h-full items-center border-r px-3 font-medium select-none">+62</span>
            <input
                ref={ref}
                type="tel"
                inputMode="numeric"
                value={local}
                onChange={handleChange}
                placeholder="8123456789"
                className="placeholder:text-muted-foreground h-full w-full bg-transparent px-3 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                {...props}
            />
        </div>
    );
});
PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
