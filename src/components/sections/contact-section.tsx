import type { ReactNode } from 'react';
import type { HomeContent, Profile } from '@/lib/content';
import { GithubIcon, LinkedinIcon } from '../ui/icons';
import { joinClassNames } from '../ui/join-class-names';
import styles from './contact-section.module.scss';

interface ContactSectionProps {
  contact: Pick<HomeContent['contact'], 'heading'>;
  profile: Profile;
  form?: ReactNode;
  resumeRequest?: ReactNode;
}

export function ContactSection({ contact, profile, form, resumeRequest }: ContactSectionProps) {
  return (
    <section id="contact" className="py-6 py-lg-7" aria-labelledby="contact-heading">
      <div className="container">
        <div className={joinClassNames('card text-center pf-reveal', styles.panel)}>
          <div className="card-body">
            <h2 className="mb-3" id="contact-heading">
              {contact.heading}
            </h2>
            <p className="lead text-body-secondary mb-4">{profile.availability.detail}</p>
            {form && <div className={styles.formSlot}>{form}</div>}
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-3">
              <a
                className="btn btn-icon rounded-circle"
                href={profile.links.github}
                aria-label="GitHub profile"
              >
                <GithubIcon className="fs-5" />
              </a>
              <a
                className="btn btn-icon rounded-circle"
                href={profile.links.linkedin}
                aria-label="LinkedIn profile"
              >
                <LinkedinIcon className="fs-5" />
              </a>
              {resumeRequest}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
