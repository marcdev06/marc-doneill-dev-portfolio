import type { ExperienceEntry } from '@/lib/content';
import { joinClassNames } from '../ui/join-class-names';
import { MonthRange } from '../ui/month-range';
import styles from './experience-section.module.scss';

interface ExperienceSectionProps {
  heading: string;
  entries: readonly ExperienceEntry[];
}

export function ExperienceSection({ heading, entries }: ExperienceSectionProps) {
  return (
    <section id="experience" className="py-6 py-lg-7" aria-labelledby="experience-heading">
      <div className="container">
        <h2 className="mb-5 pf-reveal" id="experience-heading">
          {heading}
        </h2>
        <ol className={styles.timeline}>
          {entries.map((entry, entryIndex) => (
            <li className={joinClassNames(styles.timelineItem, 'pf-reveal')} key={entry.company}>
              <article
                className={joinClassNames('card pf-lift', styles.glowCard)}
                aria-labelledby={`experience-company-${String(entryIndex)}`}
              >
                <div className={joinClassNames('card-body', styles.cardLayout)}>
                  <div>
                    <h3
                      className="card-title fw-semibold mb-1"
                      id={`experience-company-${String(entryIndex)}`}
                    >
                      {entry.companyUrl ? (
                        <a href={entry.companyUrl}>{entry.company}</a>
                      ) : (
                        entry.company
                      )}
                    </h3>
                    {entry.context ? (
                      <p className="small text-body-secondary mb-0">{entry.context}</p>
                    ) : null}
                    <ul className={styles.roles}>
                      {entry.roles.map((role) => (
                        <li className={styles.role} key={`${role.title}-${role.start}`}>
                          <span className="fw-semibold">{role.title}</span>
                          <MonthRange
                            className="small text-body-secondary"
                            start={role.start}
                            end={role.end}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.details}>
                    <ul className={styles.bullets}>
                      {entry.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
