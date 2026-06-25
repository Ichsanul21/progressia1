import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Stat {
    value: number;
    suffix: string;
    label: string;
    detail: string;
}

const STATS: Stat[] = [
    { value: 80, suffix: '%', label: 'lebih cepat', detail: 'Update progress dibanding rekap di Excel' },
    { value: 60, suffix: '%', label: 'hemat waktu', detail: 'Rekap Rencana Anggaran Biaya (RAB) otomatis' },
    { value: 10, suffix: '×', label: 'lebih cepat', detail: 'Track multi-vendor dalam satu workspace' },
];

function StatCounter({ stat }: { stat: Stat }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const count = useMotionValue(0);
    const rounded = useTransform(count, (v) => Math.round(v));

    useEffect(() => {
        if (!inView) return;
        const controls = animate(count, stat.value, { duration: 1.6, ease: 'easeOut' });
        return () => controls.stop();
    }, [count, inView, stat.value]);

    return (
        <div ref={ref} className="text-center md:text-left">
            <div className="text-foreground flex items-baseline justify-center gap-1 md:justify-start">
                <motion.span className="text-foreground font-mono text-5xl font-medium tracking-tight md:text-6xl">{rounded}</motion.span>
                <span className="text-primary font-mono text-3xl font-medium md:text-4xl">{stat.suffix}</span>
            </div>
            <div className="text-foreground mt-2 text-sm font-medium md:text-base">{stat.label}</div>
            <div className="text-muted-foreground mt-1 text-xs md:text-sm">{stat.detail}</div>
        </div>
    );
}

export default function LandingStats() {
    return (
        <section className="border-border/60 bg-muted/30 border-y py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-10 md:grid-cols-3 md:gap-12">
                    {STATS.map((stat, i) => (
                        <StatCounter key={i} stat={stat} />
                    ))}
                </div>
            </div>
        </section>
    );
}
