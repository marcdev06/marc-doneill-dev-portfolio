import type { CSSProperties } from 'react';
import type { SkillTier } from '@/lib/content';
import { joinClassNames } from '../ui/join-class-names';
import { SimpleIconMark } from '../ui/simple-icon-mark';
import { findSkillIcon } from './skill-icons';
import styles from './skill-orbit.module.scss';

interface SkillOrbitProps {
  tiers: readonly SkillTier[];
  centerLabel: string;
}

// Odd rings shift half a step so icons interleave
function placeOnRing(iconIndex: number, iconCount: number, ringIndex: number): CSSProperties {
  const stepDegrees = 360 / iconCount;
  const angleDegrees = stepDegrees * (iconIndex + (ringIndex % 2) / 2);
  return { '--orbit-angle': `${String(angleDegrees)}deg` } as CSSProperties;
}

export function SkillOrbit({ tiers, centerLabel }: SkillOrbitProps) {
  return (
    <div className={styles.orbit} aria-hidden="true" data-testid="skill-orbit">
      <div className={styles.center}>{centerLabel}</div>
      {tiers.map((tier, ringIndex) => {
        const iconSkills = tier.groups
          .flatMap((skillGroup) => skillGroup.names)
          .flatMap((skillName) => {
            const skillIcon = findSkillIcon(skillName);
            return skillIcon ? [{ skillName, skillIcon }] : [];
          });
        return (
          <div className={joinClassNames(styles.ring, styles[tier.id])} key={tier.id}>
            {iconSkills.map(({ skillName, skillIcon }, iconIndex) => (
              <span
                className={styles.node}
                key={skillName}
                style={placeOnRing(iconIndex, iconSkills.length, ringIndex)}
              >
                <span className={styles.iconNode} title={skillName}>
                  <SimpleIconMark icon={skillIcon} />
                </span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
