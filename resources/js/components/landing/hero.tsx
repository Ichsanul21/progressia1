import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const headlineWords = ['Kelola', 'proyek', 'konstruksi,', 'dan', 'tim', 'apa', 'pun,', 'tanpa', 'drama.'];

const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
};

const word = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const fadeRight = {
    hidden: { opacity: 0, x: 24 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut', delay: 0.6 } },
};

export default function LandingHero() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
            <div className="from-primary/5 via-background to-background absolute inset-0 -z-10 bg-gradient-to-b" />
            <div className="bg-primary/10 absolute -top-40 right-1/4 -z-10 h-[480px] w-[480px] rounded-full blur-3xl" aria-hidden />

            <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-12 md:items-center">
                <motion.div className="md:col-span-7" variants={container} initial="hidden" animate="show">
                    <motion.span variants={fadeUp} className="text-muted-foreground mb-6 inline-block font-mono text-xs tracking-[0.2em] uppercase">
                        Project management untuk tim yang actually kerja
                    </motion.span>

                    <motion.h1 className="text-foreground text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl" variants={container}>
                        {headlineWords.map((w, i) => (
                            <motion.span key={i} variants={word} className={i === 6 || i === 8 ? 'font-display italic' : ''}>
                                {w}{' '}
                            </motion.span>
                        ))}
                    </motion.h1>

                    <motion.p variants={fadeUp} className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed md:text-xl">
                        Gantt, Kanban, RAB, multi-vendor, dan progress real-time dalam satu app yang tidak bikin pusing.
                    </motion.p>

                    <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
                        <Link href={route('login')}>
                            <Button size="lg">
                                Login
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href={route('register')}>
                            <Button size="lg" variant="outline">
                                Daftar sekarang
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div className="md:col-span-5" variants={fadeRight} initial="hidden" animate="show">
                    <div className="border-border/60 from-primary/15 via-muted to-primary/5 shadow-primary/5 relative aspect-[4/5] overflow-hidden rounded-2xl border bg-gradient-to-br shadow-2xl">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.7_0.15_220_/_0.25),transparent_50%)]" />
                        <div className="border-border/40 bg-background/80 absolute inset-x-8 bottom-8 rounded-xl border p-4 backdrop-blur">
                            <div className="text-muted-foreground mb-2 font-mono text-[10px] tracking-wider uppercase">Live preview</div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="bg-muted h-2 flex-1 rounded-full" />
                                    <div className="bg-primary/60 h-2 w-1/3 rounded-full" />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="bg-muted h-2 w-2/3 rounded-full" />
                                    <div className="bg-primary/40 h-2 w-1/4 rounded-full" />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="bg-muted h-2 w-1/2 rounded-full" />
                                    <div className="bg-primary/70 h-2 w-1/5 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
