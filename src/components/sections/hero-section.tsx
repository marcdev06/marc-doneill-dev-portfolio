import Image from 'next/image';
import type { HeroContent, Profile } from '@/lib/content';
import { ArrowRightIcon, ClockIcon, GeoIcon, GithubIcon, LinkedinIcon } from '../ui/icons';
import { joinClassNames } from '../ui/join-class-names';
import { RichText } from '../ui/rich-text';
import styles from './hero-section.module.scss';
import { Typewriter } from './typewriter';

interface HeroSectionProps {
  hero: HeroContent;
  profile: Profile;
}

export function HeroSection({ hero, profile }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.warmGlow} aria-hidden="true" />
      <div className={joinClassNames('container', styles.layout)}>
        <div className={styles.photoColumn}>
          <div className={styles.photoFrame}>
            <div className={styles.photoGlow} aria-hidden="true" />
            <Image
              className={styles.photo}
              src={profile.photo.src}
              alt={profile.photo.alt}
              width={profile.photo.width}
              height={profile.photo.height}
              sizes="(min-width: 992px) 380px, 216px"
              priority
            />
          </div>
        </div>
        <div className={styles.copy}>
          <p className={styles.availability}>
            <span className={styles.availabilityDot} aria-hidden="true" />
            {profile.availability.headline}
          </p>
          <p className={styles.greeting}>{hero.greeting}</p>
          <h1 className={styles.headline} id="hero-heading">
            {hero.headline.beforeHighlight}
            <span className={styles.highlight}>{hero.headline.highlight}</span>
            {hero.headline.afterHighlight}
          </h1>
          <Typewriter prefix={hero.typewriter.prefix} phrases={hero.typewriter.phrases} />
          <p className={styles.evidence}>
            <RichText segments={hero.evidence} linkClassName={styles.evidenceLink} />
          </p>
          <p className="lead text-body-secondary mb-0">{hero.lead}</p>
          <div className="d-flex flex-wrap gap-3 mt-2">
            <a className="btn btn-primary btn-glow" href={hero.primaryAction.href}>
              {hero.primaryAction.label}
              <ArrowRightIcon className="ms-2" />
            </a>
            <a className="btn btn-outline-body" href={hero.secondaryAction.href}>
              {hero.secondaryAction.label}
            </a>
          </div>
          <ul className={styles.meta}>
            <li className={styles.metaItem}>
              <GeoIcon />
              {profile.location}
            </li>
            <li className={styles.metaItem}>
              <ClockIcon />
              {profile.timeZoneLabel}
            </li>
            <li className="d-inline-flex">
              <a
                className="btn btn-icon btn-icon-plain rounded-circle"
                href={profile.links.github}
                aria-label="GitHub profile"
              >
                <GithubIcon className="fs-5" />
              </a>
              <a
                className="btn btn-icon btn-icon-plain rounded-circle"
                href={profile.links.linkedin}
                aria-label="LinkedIn profile"
              >
                <LinkedinIcon className="fs-5" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
