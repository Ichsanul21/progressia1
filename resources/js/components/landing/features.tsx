import { motion } from 'framer-motion';

interface Feature {
    number: string;
    title: string;
    description: string;
    bullets: string[];
}

const FEATURES: Feature[] = [
    {
        number: '01',
        title: 'Gantt, Kanban, Kalender',
        description: 'Visualisasi proyek dari berbagai sudut tanpa perlu pindah tab.',
        bullets: ['Gantt interaktif dengan dependency', 'Kanban drag & drop', 'Kalender deadline tim'],
    },
    {
        number: '02',
        title: 'Multi-Vendor & Sub-Vendor',
        description: 'Kelola tim internal dan kontraktor pihak ketiga dalam satu workspace.',
        bullets: ['Assign task lintas vendor', 'Sub-vendor punya akun sendiri', 'Progress terisolasi per vendor'],
    },
    {
        number: '03',
        title: 'Progress Real-time dengan Foto',
        description: 'Update lapangan langsung dengan dokumentasi visual yang tidak hilang.',
        bullets: ['Upload foto per progress', 'Timeline aktivitas', 'Notifikasi perubahan instan'],
    },
];

export default function LandingFeatures() {
    return (
        <section id="fitur" className="py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    className="mb-14 max-w-2xl"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-muted-foreground mb-3 inline-block font-mono text-xs tracking-[0.2em] uppercase">Fitur</span>
                    <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-5xl">
                        Tools yang tim <span className="font-display italic">sesungguhnya</span> butuh.
                    </h2>
                    <p className="text-muted-foreground mt-4 text-lg">Tanpa over-engineered workflow. Tanpa chart yang cuma bagus di demo.</p>
                </motion.div>

                <div className="grid gap-6 md:grid-cols-3">
                    {FEATURES.map((feature, i) => (
                        <motion.div
                            key={feature.number}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group border-border/60 hover:border-primary/40 bg-card relative overflow-hidden rounded-2xl border p-8 transition-colors"
                        >
                            <div className="text-primary mb-6 font-mono text-sm tracking-wider">{feature.number}</div>
                            <h3 className="text-foreground text-xl font-semibold">{feature.title}</h3>
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{feature.description}</p>
                            <ul className="mt-6 space-y-2">
                                {feature.bullets.map((b) => (
                                    <li key={b} className="text-muted-foreground flex items-start gap-2 text-sm">
                                        <span className="text-primary mt-0.5">→</span>
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
