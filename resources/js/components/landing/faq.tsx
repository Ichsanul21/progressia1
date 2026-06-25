import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const FAQS = [
    {
        q: 'Berapa lama setup Progressia?',
        a: 'Untuk satu vendor dengan 5-10 user, sekitar 1-2 jam: buat akun, invite tim, import data RAB (kalau ada), atur project. Kalau ada data migrasi dari Excel atau sistem lain, kami bisa bantu gratis di minggu pertama.',
    },
    {
        q: 'Apakah data proyek saya aman?',
        a: 'Data disimpan di server terisolasi per vendor. Backup harian otomatis. Akses user dibatasi by role dan vendor. Kami tidak share data ke pihak ketiga.',
    },
    {
        q: 'Apakah Progressia mendukung multi-tenant?',
        a: 'Ya. Setiap vendor punya workspace terisolasi. Beberapa tim project manager, anggota tim, dan sub-vendor bisa berada dalam satu vendor dengan visibility yang diatur per project.',
    },
    {
        q: 'Bagaimana sub-vendor mengupdate progress?',
        a: 'Sub-vendor punya akun sendiri dengan role khusus. Mereka hanya melihat dan update task yang di-assign ke sub-vendor mereka. Tidak perlu akses ke project internal vendor.',
    },
    {
        q: 'Apakah ada free trial?',
        a: 'Saat ini kami belum publish paket harga publik. Untuk mencoba, daftar lewat form di website ini, tim kami akan menghubungi via WhatsApp dalam 1x24 jam untuk onboarding.',
    },
];

export default function LandingFaq() {
    return (
        <section id="faq" className="py-20 md:py-28">
            <div className="mx-auto max-w-3xl px-6">
                <motion.div
                    className="mb-12 text-center"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-muted-foreground mb-3 inline-block font-mono text-xs tracking-[0.2em] uppercase">FAQ</span>
                    <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-5xl">Pertanyaan yang sering ditanya.</h2>
                </motion.div>

                <Accordion type="single" collapsible className="w-full">
                    {FAQS.map((item, i) => (
                        <AccordionItem key={i} value={`item-${i}`}>
                            <AccordionTrigger className="text-left text-base font-medium">{item.q}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
