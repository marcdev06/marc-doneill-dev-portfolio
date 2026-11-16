import type { ReactNode } from 'react';
import { formatDisplayUrl, listSkillTiers, type Profile, type ResumeContent } from '@/lib/content';
import { SkillOrbit } from '../sections/skill-orbit';
import { findSkillIcon } from '../sections/skill-icons';
import { GithubIcon, LinkedinIcon } from '../ui/icons';
import { joinClassNames } from '../ui/join-class-names';
import { MonthRange } from '../ui/month-range';
import { SimpleIconSprite } from '../ui/simple-icon-mark';
import styles from './resume-document.module.scss';
import { resumeItalicFont, resumeMediumFont } from './resume-fonts';
import {
  BriefcaseFillIcon,
  EnvelopeFillIcon,
  GeoAltFillIcon,
  GlobeIcon,
  MortarboardFillIcon,
  PersonFillIcon,
  PersonLinesFillIcon,
  ToolsIcon,
} from './resume-icons';

interface ResumeDocumentProps {
  resume: ResumeContent;
  contentHash: string;
  fileName: string;
  photo: Profile['photo'];
  siteUrl: URL | undefined;
  contactEmail: string | undefined;
}

interface SectionHeadingProps {
  id: string;
  icon: ReactNode;
  isInSidebar?: boolean;
  children: ReactNode;
}

function SectionHeading({ id, icon, isInSidebar = false, children }: SectionHeadingProps) {
  return (
    <h2
      className={joinClassNames(styles.sectionHeading, isInSidebar && styles.sidebarHeading)}
      id={id}
    >
      <span className={styles.headingBadge} aria-hidden="true">
        {icon}
      </span>
      {children}
    </h2>
  );
}

interface ContactItemProps {
  icon: ReactNode;
  children: ReactNode;
}

function ContactItem({ icon, children }: ContactItemProps) {
  return (
    <li className={styles.contactItem}>
      <span className={styles.contactIcon} aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

// Narrow sidebars break long addresses after the @
function BreakableEmail({ address }: { address: string }) {
  const domainStart = address.lastIndexOf('@') + 1;
  return (
    <>
      {address.slice(0, domainStart)}
      <wbr />
      {address.slice(domainStart)}
    </>
  );
}

export function ResumeDocument({
  resume,
  contentHash,
  fileName,
  photo,
  siteUrl,
  contactEmail,
}: ResumeDocumentProps) {
  const skillTiers = listSkillTiers(resume.skills);
  const orbitIcons = skillTiers
    .flatMap((tier) => tier.groups.flatMap((skillGroup) => skillGroup.names))
    .map((skillName) => findSkillIcon(skillName))
    .filter((skillIcon) => skillIcon !== undefined);
  const contactLinks = [
    { href: resume.links.linkedin, icon: <LinkedinIcon /> },
    { href: resume.links.github, icon: <GithubIcon /> },
    ...(siteUrl ? [{ href: siteUrl.href, icon: <GlobeIcon /> }] : []),
  ];

  return (
    <div className={styles.page}>
      <article
        className={joinClassNames(
          styles.sheet,
          resumeMediumFont.variable,
          resumeItalicFont.variable,
        )}
        data-bs-theme="light"
        data-content-hash={contentHash}
        data-file-name={fileName}
        aria-labelledby="resume-name"
      >
        <header className={styles.masthead}>
          <h1 className={styles.name} id="resume-name">
            {resume.name}
          </h1>
          <span className={styles.accentBar} aria-hidden="true" />
          <p className={styles.title}>{resume.title}</p>
        </header>

        <div className={styles.sidebarTop} data-bs-theme="dark">
          {/* eslint-disable-next-line @next/next/no-img-element -- The PDF embeds the original JPEG */}
          <img
            className={styles.photo}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
          />
          <section className={styles.sidebarSection} aria-labelledby="resume-contact">
            <SectionHeading id="resume-contact" icon={<PersonLinesFillIcon />} isInSidebar>
              {resume.headings.contact}
            </SectionHeading>
            <ul className={styles.contactList}>
              {contactEmail ? (
                <ContactItem icon={<EnvelopeFillIcon />}>
                  <BreakableEmail address={contactEmail} />
                </ContactItem>
              ) : null}
              {contactLinks.map((contactLink) => (
                <ContactItem icon={contactLink.icon} key={contactLink.href}>
                  <a href={contactLink.href}>{formatDisplayUrl(contactLink.href)}</a>
                </ContactItem>
              ))}
              <ContactItem icon={<GeoAltFillIcon />}>{resume.location}</ContactItem>
            </ul>
          </section>
        </div>

        <div className={styles.mainBody}>
          <section className={styles.mainSection} aria-labelledby="resume-about">
            <SectionHeading id="resume-about" icon={<PersonFillIcon />}>
              {resume.headings.about}
            </SectionHeading>
            <p className={styles.about}>{resume.about}</p>
          </section>

          <section className={styles.mainSection} aria-labelledby="resume-experience">
            <SectionHeading id="resume-experience" icon={<BriefcaseFillIcon />}>
              {resume.headings.experience}
            </SectionHeading>
            <ol className={styles.timeline}>
              {resume.experience.map((entry) => (
                <li className={styles.timelineEntry} key={entry.company}>
                  {entry.roles.map((role) => (
                    <div className={styles.role} key={`${role.title}-${role.start}`}>
                      <h3 className={styles.roleTitle}>{role.title}</h3>
                      <MonthRange className={styles.dates} start={role.start} end={role.end} />
                    </div>
                  ))}
                  <p className={styles.company}>
                    <span className={styles.companyName}>{entry.company}</span>
                    {entry.context ? (
                      <>
                        <span className={styles.separator}> · </span>
                        <span className={styles.context}>{entry.context}</span>
                      </>
                    ) : null}
                  </p>
                  <ul className={styles.bullets}>
                    {entry.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className={styles.sidebarBottom} data-bs-theme="dark">
          <section className={styles.sidebarSection} aria-labelledby="resume-education">
            <SectionHeading id="resume-education" icon={<MortarboardFillIcon />} isInSidebar>
              {resume.headings.education}
            </SectionHeading>
            {resume.education.map((entry) => (
              <div className={styles.education} key={entry.degree}>
                <h3 className={styles.degree}>{entry.degree}</h3>
                <p className={styles.school}>{entry.school}</p>
                <p className={styles.school}>
                  {entry.city} · {entry.startYear} – {entry.endYear}
                </p>
              </div>
            ))}
          </section>

          <section className={styles.sidebarSection} aria-labelledby="resume-skills">
            <SectionHeading id="resume-skills" icon={<ToolsIcon />} isInSidebar>
              {resume.headings.skills}
            </SectionHeading>
            <div className={styles.skillTiers}>
              <div className={styles.orbitBackdrop} aria-hidden="true">
                <SimpleIconSprite icons={orbitIcons} />
                <SkillOrbit tiers={skillTiers} isPrintSnapshot className={styles.orbit} />
              </div>
              <dl className={styles.skillList}>
                {skillTiers.map((tier) => (
                  <div className={styles.skillTier} key={tier.id}>
                    <dt>{tier.label}</dt>
                    <dd>{tier.groups.flatMap((skillGroup) => skillGroup.names).join(', ')}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
