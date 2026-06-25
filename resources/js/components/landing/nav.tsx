import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
    { label: 'Fitur', href: '#fitur' },
    { label: 'Solusi', href: '#solusi' },
    { label: 'Testimoni', href: '#testimoni' },
    { label: 'FAQ', href: '#faq' },
];

export default function LandingNav() {
    const [scrolled, setScrolled] = useState(false);
    const { auth } = usePage().props as { auth: { user: { name: string } | null } };

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 80);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div
            className={cn(
                'sticky top-0 z-40 transition-all duration-300',
                scrolled ? 'bg-background/80 border-border/60 border-b backdrop-blur-lg' : 'bg-transparent',
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold">
                        P
                    </span>
                    <span className="font-display text-xl">Progressia.</span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {NAV_ITEMS.map((item) => (
                        <a key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    {auth.user ? (
                        <Link href={route('dashboard')}>
                            <Button size="sm">Dashboard</Button>
                        </Link>
                    ) : (
                        <>
                            <Link href={route('login')}>
                                <Button variant="ghost" size="sm">
                                    Login
                                </Button>
                            </Link>
                            <Link href={route('register')}>
                                <Button size="sm">Daftar</Button>
                            </Link>
                        </>
                    )}
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                        <div className="flex items-center justify-between pb-4">
                            <span className="font-display text-xl">Progressia.</span>
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon">
                                    <X className="h-5 w-5" />
                                </Button>
                            </SheetClose>
                        </div>
                        <nav className="flex flex-col gap-1">
                            {NAV_ITEMS.map((item) => (
                                <SheetClose asChild key={item.href}>
                                    <a href={item.href} className="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors">
                                        {item.label}
                                    </a>
                                </SheetClose>
                            ))}
                        </nav>
                        <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                            {auth.user ? (
                                <Link href={route('dashboard')}>
                                    <Button className="w-full">Dashboard</Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')}>
                                        <Button variant="outline" className="w-full">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href={route('register')}>
                                        <Button className="w-full">Daftar</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
