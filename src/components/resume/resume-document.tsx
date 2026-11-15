import { formatDisplayUrl, listSkillTiers, type ResumeContent } from '@/lib/content';
import { DownloadIcon } from '../ui/icons';
import { joinClassNames } from '../ui/join-class-names';
import { MonthRange } from '../ui/month-range';
import styles from './resume-document.module.scss';

interface ResumeDocumentProps {
  resume: ResumeContent;
  contentHash: string;
  siteUrl: URL | undefined;
  pdfPath: string;
  downloadLabel: string;
}

export function ResumeDocument({
  resume,
  contentHash,
  siteUrl,
  pdfPath,
  downloadLabel,
}: ResumeDocumentProps) {
  const contactLinks = [
    { href: `mailto:${resume.email}`, label: resume.email },
    { href: resume.links.linkedin, label: formatDisplayUrl(resume.links.linkedin) },
    { href: resume.links.github, label: formatDisplayUrl(resume.links.github) },
    ...(siteUrl ? [{ href: siteUrl.href, label: formatDisplayUrl(siteUrl.href) }] : []),
  ];

  return (
    <div className={styles.page}>
      <div className={joinClassNames(styles.toolbar, 'd-print-none')}>
        <a className="btn btn-primary btn-glow" href={pdfPath} download>
          <DownloadIcon className="me-2" />
          {downloadLabel}
        </a>
      </div>
      <article
        className={styles.sheet}
        data-bs-theme="light"
        data-content-hash={contentHash}
        aria-labelledby="resume-name"
      >
        <header className={styles.header}>
          <h1 className={styles.name} id="resume-name">
            {resume.name}
          </h1>
          <p className={styles.title}>{resume.title}</p>
          <ul className={styles.contactList}>
            <li>{resume.location}</li>
            {contactLinks.map((contactLink) => (
              <li key={contactLink.href}>
                <a href={contactLink.href}>{contactLink.label}</a>
              </li>
            ))}
          </ul>
        </header>

        <section aria-labelledby="resume-experience">
          <h2 className={styles.sectionHeading} id="resume-experience">
            {resume.headings.experience}
          </h2>
          {resume.experience.map((entry) => (
            <div className={styles.entry} key={entry.company}>
              <h3 className={styles.entryHeading}>
                {entry.company}
                {entry.context ? <span className={styles.context}> · {entry.context}</span> : null}
              </h3>
              <ul className={styles.roles}>
                {entry.roles.map((role) => (
                  <li className={styles.role} key={`${role.title}-${role.start}`}>
                    <span className={styles.roleTitle}>{role.title}</span>
                    <MonthRange className={styles.dates} start={role.start} end={role.end} />
                  </li>
                ))}
              </ul>
              <ul className={styles.bullets}>
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="resume-skills">
          <h2 className={styles.sectionHeading} id="resume-skills">
            {resume.headings.skills}
          </h2>
          <dl className={styles.skills}>
            {listSkillTiers(resume.skills).map((tier) => (
              <div className={styles.skillTier} key={tier.id}>
                <dt>{tier.label}</dt>
                <dd>
                  {tier.groups.map((skillGroup) => (
                    <span className={styles.skillGroup} key={skillGroup.group}>
                      <span className={styles.skillGroupName}>{skillGroup.group}:</span>{' '}
                      {skillGroup.names.join(', ')}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="resume-education">
          <h2 className={styles.sectionHeading} id="resume-education">
            {resume.headings.education}
          </h2>
          {resume.education.map((entry) => (
            <div className={styles.role} key={entry.degree}>
              <span>
                <span className={styles.roleTitle}>{entry.degree}</span>
                <br />
                {entry.school} · {entry.city}
              </span>
              <span className={styles.dates}>
                {entry.startYear} – {entry.endYear}
              </span>
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}
