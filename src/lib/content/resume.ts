import { computeContentHash } from './content-hash';
import type { EducationEntry } from './education-schema';
import type { ExperienceEntry } from './experience-schema';
import type { HomeContent } from './home-schema';
import type { Profile } from './profile-schema';
import type { SiteContent } from './site-schema';
import type { Skills } from './skills-schema';

export interface ResumeSources {
  profile: Profile;
  about: string;
  experience: ExperienceEntry[];
  skills: Skills;
  education: EducationEntry[];
  sectionCopy: Pick<HomeContent, 'experience' | 'skills' | 'education'>;
  resumeCopy: SiteContent['resumePage'];
}

// The email and site URL come from env, so stay out
export function composeResume({
  profile,
  about,
  experience,
  skills,
  education,
  sectionCopy,
  resumeCopy,
}: ResumeSources) {
  return {
    name: profile.name,
    title: profile.title,
    location: profile.location,
    links: { github: profile.links.github, linkedin: profile.links.linkedin },
    about,
    headings: {
      contact: resumeCopy.headings.contact,
      about: resumeCopy.headings.about,
      experience: sectionCopy.experience.heading,
      skills: sectionCopy.skills.heading,
      education: sectionCopy.education.heading,
    },
    experience,
    skills,
    education,
  };
}

export type ResumeContent = ReturnType<typeof composeResume>;

export function computeResumeContentHash(resume: ResumeContent): string {
  return computeContentHash(resume);
}

export function formatDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
}
