import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'progressia-splash-shown';
const WORDS = ['Pro', 'gres', 'sia.'];

export default function LoadingSplash() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const alreadyShown = sessionStorage.getItem(STORAGE_KEY);
        if (alreadyShown) return;

        setVisible(true);
        const completeTimer = setTimeout(() => {
            setVisible(false);
            sessionStorage.setItem(STORAGE_KEY, '1');
        }, 1800);

        return () => clearTimeout(completeTimer);
    }, []);

    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="splash"
                className="bg-primary fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <div className="font-display text-primary-foreground flex items-center gap-2 text-7xl md:text-8xl">
                    {WORDS.map((word, i) => (
                        <motion.span
                            key={`${word}-${i}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.25, ease: 'easeOut' }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
