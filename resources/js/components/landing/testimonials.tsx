import { motion } from 'framer-motion';

interface Testimonial {
    quote: string;
    name: string;
    role: string;
    company: string;
    initials: string;
}

const TESTIMONIALS: Testimonial[] = [
    {
        quote: 'Sebelum Progressia, kami rekap progress di WhatsApp dan Excel. Sekarang tim lapangan update foto langsung, kantor tinggal lihat.',
        name: 'Budi Santoso',
        role: 'Direktur Operasional',
        company: 'PT Konstruksi Nusantara',
        initials: 'BS',
    },
    {
        quote: 'Multi-vendor-nya yang nge-game changer. Sub-vonor kami sekarang punya akun sendiri dan update progress tanpa lewat saya.',
        name: 'Sri Rahayu',
        role: 'Project Manager',
        company: 'CV Bangun Jaya',
        initials: 'SR',
    },
    {
        quote: 'Klien akhirnya bisa lihat timeline sendiri tanpa harus saya screenshot dashboard tiap minggu. Hemat waktu banget.',
        name: 'Andre Wijaya',
        role: 'Owner',
        company: 'Agensi Kreatif Indonesia',
        initials: 'AW',
    },
];

export default function LandingTestimonials() {
    return (
        <section id="testimoni" className="bg-sidebar text-sidebar-foreground py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    className="mb-14 max-w-2xl"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-sidebar-foreground/60 mb-3 inline-block font-mono text-xs tracking-[0.2em] uppercase">Testimoni</span>
                    <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Cerita dari tim yang sudah pakai.</h2>
                </motion.div>

                <div className="grid gap-6 md:grid-cols-3">
                    {TESTIMONIALS.map((t, i) => (
                        <motion.figure
                            key={t.name}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="border-sidebar-accent bg-sidebar-accent/30 flex flex-col justify-between rounded-2xl border p-8"
                        >
                            <blockquote className="font-display text-lg leading-relaxed italic md:text-xl">"{t.quote}"</blockquote>
                            <figcaption className="mt-8 flex items-center gap-3">
                                <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm">
                                    {t.initials}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{t.name}</div>
                                    <div className="text-sidebar-foreground/60 text-xs">
                                        {t.role}, {t.company}
                                    </div>
                                </div>
                            </figcaption>
                        </motion.figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
