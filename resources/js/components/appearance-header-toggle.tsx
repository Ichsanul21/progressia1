import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

function resolveIsDark(appearance: 'light' | 'dark' | 'system') {
    if (appearance === 'dark') return true;
    if (appearance === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function AppearanceHeaderToggle() {
    const { appearance, updateAppearance } = useAppearance();
    const [isDark, setIsDark] = useState(() => resolveIsDark(appearance));

    useEffect(() => {
        setIsDark(resolveIsDark(appearance));
    }, [appearance]);

    useEffect(() => {
        if (appearance !== 'system') return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => setIsDark(mql.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [appearance]);

    const toggle = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md"
            onClick={toggle}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
    );
}
