import type { Organization, Person, ProfilePage, WithContext } from 'schema-dts';
import type { EducationEntry, ExperienceEntry, Profile, Skills } from '../content';

export interface ProfilePageSources {
  profile: Profile;
  description: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: Skills;
  siteUrl: URL;
}

function splitLocation(location: string) {
  const separatorIndex = location.lastIndexOf(', ');
  return {
    locality: location.slice(0, separatorIndex),
    countryCode: location.slice(separatorIndex + ', '.length),
  };
}

function describeCurrentEmployer(experience: ExperienceEntry[]): Organization | undefined {
  const currentEntry = experience.find((entry) => entry.roles.some((role) => !role.end));
  if (!currentEntry) {
    return undefined;
  }
  return {
    '@type': 'Organization',
    name: currentEntry.company,
    ...(currentEntry.companyUrl ? { url: currentEntry.companyUrl } : {}),
  };
}

export function buildProfilePageJsonLd({
  profile,
  description,
  experience,
  education,
  skills,
  siteUrl,
}: ProfilePageSources): WithContext<ProfilePage> {
  const { locality, countryCode } = splitLocation(profile.location);
  const currentEmployer = describeCurrentEmployer(experience);

  const person: Person = {
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    description,
    url: siteUrl.href,
    image: new URL(profile.photo.src, siteUrl).href,
    sameAs: [profile.links.linkedin, profile.links.github],
    address: { '@type': 'PostalAddress', addressLocality: locality, addressCountry: countryCode },
    ...(currentEmployer ? { worksFor: currentEmployer } : {}),
    alumniOf: education.map((entry) => ({
      '@type': 'EducationalOrganization',
      name: entry.school,
    })),
    knowsAbout: skills.core.groups.flatMap((skillGroup) => skillGroup.names),
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: siteUrl.href,
    mainEntity: person,
  };
}

export function serializeJsonLd(structuredData: object): string {
  // A "</script>" inside a string would end the tag early
  return JSON.stringify(structuredData).replace(/</g, '\\u003c');
}
