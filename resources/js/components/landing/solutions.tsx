import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface Solution {
    key: string;
    label: string;
    headline: string;
    description: string;
    bullets: string[];
}

const SOLUTIONS: Solution[] = [
    {
        key: 'konstruksi',
        label: 'Konstruksi',
        headline: 'Bangun proyek tanpa spreadsheet yang berantakan.',
        description: 'Kontraktor, konsultan pengawas, dan sub-vendor bergerak dalam satu workspace dengan RAB, schedule, dan progress real-time.',
        bullets: ['RAB import / export Excel', 'Track progress per sub-vendor', 'Phase & milestone tracking'],
    },
    {
        key: 'agensi',
        label: 'Agensi / Konsultan',
        headline: 'Klien, project manager, dan tim kreatif dalam satu board.',
        description: 'Dari kickoff sampai delivery, semua orang tahu apa yang harus dilakukan minggu ini tanpa harus Zoom call.',
        bullets: ['Client portal sederhana', 'SLA dan deadline tracking', 'Template project untuk repeat client'],
    },
    {
        key: 'internal',
        label: 'Internal Team',
        headline: 'Untuk tim internal yang perlu lebih dari spreadsheet.',
        description: 'Roadmap, sprint, dan task lintas departemen dengan visibilitas yang jelas untuk semua stakeholder.',
        bullets: ['OKR & milestone', 'Sprint planning sederhana', 'Recurring task otomatis'],
    },
    {
        key: 'manufaktur',
        label: 'Manufaktur',
        headline: 'Tracking line produksi, batch, dan delivery.',
        description: 'Cocok untuk operasional manufaktur skala kecil-menengah yang ingin digitalisasi tanpa ERP enterprise.',
        bullets: ['Batch & lot tracking', 'Delivery scheduling', 'Vendor material management'],
    },
];

export default function LandingSolutions() {
    const [active, setActive] = useState(SOLUTIONS[0].key);
    const current = SOLUTIONS.find((s) => s.key === active) ?? SOLUTIONS[0];

    return (
        <section id="solusi" className="bg-muted/30 border-border/60 border-y py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    className="mb-12 max-w-2xl"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-muted-foreground mb-3 inline-block font-mono text-xs tracking-[0.2em] uppercase">Solusi per industri</span>
                    <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-5xl">Dipakai tim di berbagai industri.</h2>
                </motion.div>

                <div className="grid gap-8 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <div className="flex flex-col gap-1">
                            {SOLUTIONS.map((s, i) => (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => setActive(s.key)}
                                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                                        active === s.key
                                            ? 'border-primary bg-card text-foreground'
                                            : 'text-muted-foreground hover:bg-card/40 hover:text-foreground border-transparent'
                                    }`}
                                >
                                    <span className={`font-mono text-xs ${active === s.key ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <span className="text-sm font-medium">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.key}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="border-border/60 bg-card rounded-2xl border p-8 md:p-10"
                            >
                                <h3 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">{current.headline}</h3>
                                <p className="text-muted-foreground mt-4 leading-relaxed">{current.description}</p>
                                <ul className="mt-6 space-y-2">
                                    {current.bullets.map((b) => (
                                        <li key={b} className="text-muted-foreground flex items-start gap-3 text-sm">
                                            <span className="text-primary bg-primary/10 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px]">
                                                ✓
                                            </span>
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
