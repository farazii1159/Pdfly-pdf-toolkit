import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import ToolsPreview from '@/components/landing/ToolsPreview';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main id="top">
      <LandingHeader />
      <LandingHero />
      <ToolsPreview />
      <HowItWorks />
      <Features />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
