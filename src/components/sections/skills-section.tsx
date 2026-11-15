import type { SkillTier } from '@/lib/content';
import { joinClassNames } from '../ui/join-class-names';
import { SimpleIconMark, SimpleIconSprite } from '../ui/simple-icon-mark';
import { findSkillIcon } from './skill-icons';
import { SkillOrbit } from './skill-orbit';
import styles from './skills-section.module.scss';

interface SkillsSectionProps {
  heading: string;
  tiers: readonly SkillTier[];
  orbitCenterLabel: string;
}

export function SkillsSection({ heading, tiers, orbitCenterLabel }: SkillsSectionProps) {
  const skillIcons = tiers
    .flatMap((tier) => tier.groups.flatMap((skillGroup) => skillGroup.names))
    .map((skillName) => findSkillIcon(skillName))
    .filter((skillIcon) => skillIcon !== undefined);

  return (
    <section id="skills" className="py-6 py-lg-7" aria-labelledby="skills-heading">
      <SimpleIconSprite icons={skillIcons} />
      <div className="container">
        <h2 className="mb-5 pf-reveal" id="skills-heading">
          {heading}
        </h2>
        <div className="row align-items-center gy-5">
          <div className="col-lg-6 d-none d-lg-block pf-reveal">
            <SkillOrbit tiers={tiers} centerLabel={orbitCenterLabel} />
          </div>
          <div className="col-lg-6">
            {tiers.map((tier) => (
              <div className="mb-4 pf-reveal" key={tier.id}>
                <h3 className="h6 mb-3" id={`skills-${tier.id}`}>
                  {tier.label}{' '}
                  {tier.summary ? (
                    <span className="fw-normal text-body-secondary">· {tier.summary}</span>
                  ) : null}
                </h3>
                <ul className={styles.chips} aria-labelledby={`skills-${tier.id}`}>
                  {tier.groups
                    .flatMap((skillGroup) => skillGroup.names)
                    .map((skillName) => {
                      const skillIcon = findSkillIcon(skillName);
                      return (
                        <li className={joinClassNames('badge', styles.chip)} key={skillName}>
                          {skillIcon ? (
                            <SimpleIconMark icon={skillIcon} className={styles.chipIcon} />
                          ) : null}
                          {skillName}
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
