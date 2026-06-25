import { useState } from 'react';

const STORAGE_KEY = 'progressia-announcement-dismissed';

export default function AnnouncementBar() {
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(STORAGE_KEY) === '1';
    });

    if (dismissed) return null;

    return (
        <div className="bg-primary/10 border-primary/20 text-foreground border-b">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2.5">
                <div className="flex flex-1 items-center justify-center gap-3 text-xs sm:text-sm">
                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase">
                        Baru
                    </span>
                    <span className="text-muted-foreground">
                        Progressia 2.0 dengan dukungan{' '}
                        <a href="#fitur" className="text-foreground font-medium underline-offset-4 hover:underline">
                            multi sub-vendor
                        </a>{' '}
                        sudah rilis.
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        localStorage.setItem(STORAGE_KEY, '1');
                        setDismissed(true);
                    }}
                    className="text-muted-foreground hover:text-foreground rounded p-1 text-xs"
                    aria-label="Tutup pengumuman"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
