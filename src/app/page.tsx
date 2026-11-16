import type { Metadata } from 'next';
import { AboutSection } from '@/components/sections/about-section';
import { ContactSection } from '@/components/sections/contact-section';
import { ExperienceSection } from '@/components/sections/experience-section';
import { HeroSection } from '@/components/sections/hero-section';
import { SkillsSection } from '@/components/sections/skills-section';
import { JsonLd } from '@/components/seo/json-ld';
import { education } from '@/content/education';
import { experience } from '@/content/experience';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { site } from '@/content/site';
import { skills } from '@/content/skills';
import { ContactForm } from '@/features/contact/contact-form';
import { ResumeRequestTrigger } from '@/features/resume-request/resume-request-trigger';
import { listSkillTiers } from '@/lib/content';
import { buildProfilePageJsonLd } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        structuredData={buildProfilePageJsonLd({
          profile,
          description: site.description,
          experience,
          education,
          skills,
          siteUrl: getSiteUrl(),
        })}
      />
      <HeroSection hero={home.hero} profile={profile} />
      <ExperienceSection heading={home.experience.heading} entries={experience} />
      <SkillsSection
        heading={home.skills.heading}
        tiers={listSkillTiers(skills)}
        orbitCenterLabel={profile.monogram}
      />
      <AboutSection about={home.about} />
      <ContactSection
        contact={home.contact}
        profile={profile}
        form={<ContactForm copy={home.contact.form} linkedinUrl={profile.links.linkedin} />}
        resumeRequest={
          <ResumeRequestTrigger
            copy={home.contact.resumeRequest}
            resumeFileName={profile.resumeFileName}
          />
        }
      />
    </>
  );
}
