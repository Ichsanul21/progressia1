import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';

    applyTheme(savedAppearance);

    // Add the event listener for system theme changes...
    mediaQuery.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('system');

    const updateAppearance = (mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode);
        applyTheme(mode);
    };

    useEffect(() => {
        const savedAppearance = localStorage.getItem('appearance') as Appearance | null;
        updateAppearance(savedAppearance || 'system');

        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, []);

    return { appearance, updateAppearance };
}

export function forceLightMode() {
    const hadDark = document.documentElement.classList.contains('dark');
    sessionStorage.setItem('forced_light_active', '1');
    sessionStorage.setItem('forced_light_had_dark', hadDark ? '1' : '0');
    document.documentElement.classList.remove('dark');
}

export function restoreLightMode() {
    if (sessionStorage.getItem('forced_light_active') !== '1') return;
    const hadDark = sessionStorage.getItem('forced_light_had_dark') === '1';
    if (hadDark) {
        document.documentElement.classList.add('dark');
    }
    sessionStorage.removeItem('forced_light_active');
    sessionStorage.removeItem('forced_light_had_dark');
}
