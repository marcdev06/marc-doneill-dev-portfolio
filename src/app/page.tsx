import { AboutSection } from '@/components/sections/about-section';
import { ContactSection } from '@/components/sections/contact-section';
import { ExperienceSection } from '@/components/sections/experience-section';
import { HeroSection } from '@/components/sections/hero-section';
import { SkillsSection } from '@/components/sections/skills-section';
import { experience } from '@/content/experience';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { skills } from '@/content/skills';
import { ContactForm } from '@/features/contact/contact-form';
import { listSkillTiers } from '@/lib/content';

export default function HomePage() {
  return (
    <>
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
        form={<ContactForm copy={home.contact.form} email={profile.email} />}
      />
    </>
  );
}
