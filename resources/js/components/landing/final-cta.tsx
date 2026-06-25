import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function LandingFinalCta() {
    return (
        <section className="bg-sidebar text-sidebar-foreground relative overflow-hidden py-20 md:py-28">
            <div className="from-primary/20 to-primary/5 absolute inset-0 bg-gradient-to-b via-transparent" />
            <div className="bg-primary/30 absolute -top-32 left-1/2 -z-0 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" aria-hidden />

            <div className="relative mx-auto max-w-3xl px-6 text-center">
                <motion.h2
                    className="text-4xl font-semibold tracking-tight md:text-6xl"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                >
                    Siap kelola proyek <span className="font-display text-primary italic">tanpa drama?</span>
                </motion.h2>

                <motion.p
                    className="text-sidebar-foreground/70 mt-6 text-lg md:text-xl"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Daftar sekarang. Tim kami akan menghubungi via WhatsApp dalam 1x24 jam untuk onboarding.
                </motion.p>

                <motion.div
                    className="mt-10 flex flex-wrap items-center justify-center gap-3"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Link href={route('register')}>
                        <Button size="lg" variant="default">
                            Daftar sekarang
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={route('login')}>
                        <Button size="lg" variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-accent">
                            Login
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
