import type { HomeContent, Profile } from '@/lib/content';
import { DownloadIcon, EnvelopeIcon, GithubIcon, LinkedinIcon } from '../ui/icons';
import { joinClassNames } from '../ui/join-class-names';
import styles from './contact-section.module.scss';

interface ContactSectionProps {
  contact: HomeContent['contact'];
  profile: Profile;
}

export function ContactSection({ contact, profile }: ContactSectionProps) {
  return (
    <section id="contact" className="py-6 py-lg-7" aria-labelledby="contact-heading">
      <div className="container">
        <div className={joinClassNames('card text-center pf-reveal', styles.panel)}>
          <div className="card-body">
            <h2 className="mb-3" id="contact-heading">
              {contact.heading}
            </h2>
            <p className="lead text-body-secondary mb-4">{profile.availability.detail}</p>
            <a className={styles.email} href={`mailto:${profile.email}`}>
              <EnvelopeIcon className={styles.emailIcon} />
              {profile.email}
            </a>
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mt-4">
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
              <a className="btn btn-primary btn-glow" href={profile.resumePath} download>
                <DownloadIcon className="me-2" />
                {contact.resumeLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
