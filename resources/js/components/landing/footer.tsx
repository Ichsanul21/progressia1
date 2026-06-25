import { Link } from '@inertiajs/react';

const COLUMNS = [
    {
        title: 'Produk',
        links: [
            { label: 'Fitur', href: '#fitur' },
            { label: 'Solusi', href: '#solusi' },
            { label: 'FAQ', href: '#faq' },
        ],
    },
    {
        title: 'Perusahaan',
        links: [
            { label: 'Tentang', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'Kontak', href: '#' },
        ],
    },
    {
        title: 'Sumber Daya',
        links: [
            { label: 'Dokumentasi', href: '#' },
            { label: 'Status', href: '#' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Privasi', href: '#' },
            { label: 'Syarat & Ketentuan', href: '#' },
        ],
    },
];

export default function LandingFooter() {
    return (
        <footer className="bg-sidebar text-sidebar-foreground border-sidebar-border border-t py-12 md:py-16">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-10 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold">
                                P
                            </span>
                            <span className="font-display text-xl">Progressia.</span>
                        </Link>
                        <p className="text-sidebar-foreground/60 mt-4 max-w-sm text-sm leading-relaxed">
                            Project management untuk tim konstruksi, agensi, internal team, dan manufaktur.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
                        {COLUMNS.map((col) => (
                            <div key={col.title}>
                                <h4 className="text-sidebar-foreground text-sm font-medium">{col.title}</h4>
                                <ul className="text-sidebar-foreground/60 mt-4 space-y-2 text-sm">
                                    {col.links.map((link) => (
                                        <li key={link.label}>
                                            <a href={link.href} className="hover:text-sidebar-foreground transition-colors">
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-sidebar-foreground/60 border-sidebar-border mt-12 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs md:flex-row">
                    <p>&copy; {new Date().getFullYear()} Progressia. All rights reserved.</p>
                    <p className="font-mono">v2.0.0</p>
                </div>
            </div>
        </footer>
    );
}
