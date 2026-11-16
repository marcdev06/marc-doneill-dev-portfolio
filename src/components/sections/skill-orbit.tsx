import type { CSSProperties } from 'react';
import type { SkillTier } from '@/lib/content';
import { joinClassNames } from '../ui/join-class-names';
import { SimpleIconMark } from '../ui/simple-icon-mark';
import { findSkillIcon } from './skill-icons';

interface SkillOrbitProps {
  tiers: readonly SkillTier[];
  centerLabel?: string;
  isPrintSnapshot?: boolean;
  className?: string;
}

// Odd rings shift half a step so icons interleave
function placeOnRing(iconIndex: number, iconCount: number, ringIndex: number): CSSProperties {
  const stepDegrees = 360 / iconCount;
  const angleDegrees = stepDegrees * (iconIndex + (ringIndex % 2) / 2);
  return { '--orbit-angle': `${String(angleDegrees)}deg` } as CSSProperties;
}

// Print snapshots stay still and add nothing to a PDF's text
export function SkillOrbit({
  tiers,
  centerLabel,
  isPrintSnapshot = false,
  className,
}: SkillOrbitProps) {
  return (
    <div
      className={joinClassNames('pf-orbit', isPrintSnapshot && 'pf-orbit-print', className)}
      aria-hidden="true"
      data-testid="skill-orbit"
    >
      <div className="pf-orbit-center">{centerLabel}</div>
      {tiers.map((tier, ringIndex) => {
        const iconSkills = tier.groups
          .flatMap((skillGroup) => skillGroup.names)
          .flatMap((skillName) => {
            const skillIcon = findSkillIcon(skillName);
            return skillIcon ? [{ skillName, skillIcon }] : [];
          });
        return (
          <div className={`pf-orbit-ring pf-orbit-ring-${tier.id}`} key={tier.id}>
            {iconSkills.map(({ skillName, skillIcon }, iconIndex) => (
              <span
                className="pf-orbit-node"
                key={skillName}
                style={placeOnRing(iconIndex, iconSkills.length, ringIndex)}
              >
                <span className="pf-orbit-icon" title={isPrintSnapshot ? undefined : skillName}>
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
