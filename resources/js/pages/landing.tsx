import AnnouncementBar from '@/components/landing/announcement-bar';
import LandingFaq from '@/components/landing/faq';
import LandingFeatures from '@/components/landing/features';
import LandingFinalCta from '@/components/landing/final-cta';
import LandingFooter from '@/components/landing/footer';
import LandingHero from '@/components/landing/hero';
import LoadingSplash from '@/components/landing/loading-splash';
import LandingNav from '@/components/landing/nav';
import LandingSolutions from '@/components/landing/solutions';
import LandingStats from '@/components/landing/stats';
import LandingTestimonials from '@/components/landing/testimonials';
import { Head } from '@inertiajs/react';

export default function Landing() {
    return (
        <>
            <Head title="Progressia — Project management untuk tim yang actually kerja" />

            <LoadingSplash />
            <header className="sticky top-0 z-50">
                <AnnouncementBar />
                <LandingNav />
            </header>

            <main>
                <LandingHero />
                <LandingStats />
                <LandingFeatures />
                <LandingSolutions />
                <LandingTestimonials />
                <LandingFaq />
                <LandingFinalCta />
            </main>

            <LandingFooter />
        </>
    );
}
