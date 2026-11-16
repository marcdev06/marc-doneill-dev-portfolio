import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { home } from '@/content/home';
import { skills } from '@/content/skills';
import { listSkillTiers } from '@/lib/content';
import { SkillsSection } from './skills-section';

function renderSkillsSection() {
  render(
    <SkillsSection
      heading={home.skills.heading}
      tiers={listSkillTiers(skills)}
      orbitCenterLabel="MB"
    />,
  );
}

describe('SkillsSection', () => {
  it('titles the section Technical Skills under the unchanged skills anchor', () => {
    renderSkillsSection();

    const section = screen.getByRole('region', { name: 'Technical Skills' });
    expect(section).toHaveAttribute('id', 'skills');
    expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Technical Skills',
    );
  });

  it('always renders an accessible list for each tier', () => {
    renderSkillsSection();

    const coreList = screen.getByRole('list', { name: /^Core\s*· Daily use$/ });
    const comfortableList = screen.getByRole('list', { name: 'Comfortable' });
    const pastList = screen.getByRole('list', { name: 'Past experience' });

    expect(within(coreList).getAllByRole('listitem')).toHaveLength(13);
    expect(within(comfortableList).getAllByRole('listitem')).toHaveLength(11);
    expect(within(pastList).getAllByRole('listitem')).toHaveLength(9);
    expect(within(coreList).getByText('TypeScript')).toBeVisible();
  });

  it('hides the decorative orbit from assistive technology', () => {
    renderSkillsSection();

    const orbit = screen.getByTestId('skill-orbit');
    expect(orbit).toHaveAttribute('aria-hidden', 'true');
    expect(orbit).toHaveTextContent('MB');
  });

  it('draws Simple Icons where they exist and text chips where they do not', () => {
    renderSkillsSection();

    const coreList = screen.getByRole('list', { name: /^Core/ });
    expect(within(coreList).getByText('React').querySelector('svg')).not.toBeNull();
    expect(within(coreList).getByText('Java').querySelector('svg')).toBeNull();

    const pastList = screen.getByRole('list', { name: 'Past experience' });
    expect(within(pastList).getByText('ASP.NET Core').querySelector('svg')).toBeNull();

    const orbit = screen.getByTestId('skill-orbit');
    expect(within(orbit).getByTitle('React').querySelector('use')).toHaveAttribute(
      'href',
      '#simple-icon-react',
    );
  });

  it('puts only icon marks on the orbit, spaced evenly per ring', () => {
    renderSkillsSection();

    const orbit = screen.getByTestId('skill-orbit');
    expect(orbit).toHaveTextContent(/^MB$/);
    for (const textOnlySkill of ['Java', 'AWS', 'Playwright', 'Amazon QLDB', 'C#']) {
      expect(within(orbit).queryByTitle(textOnlySkill)).toBeNull();
    }

    const ringAngles = [...orbit.children]
      .slice(1)
      .map((ring) =>
        [...ring.children].map((node) =>
          Number.parseFloat((node as HTMLElement).style.getPropertyValue('--orbit-angle')),
        ),
      );
    expect(ringAngles.map((angles) => angles.length)).toEqual([12, 5, 7]);
    expect(ringAngles[0]?.slice(0, 2)).toEqual([0, 30]);
    expect(ringAngles[1]?.slice(0, 2)).toEqual([36, 108]);
    expect(ringAngles[2]?.at(-1)).toBeCloseTo(360 - 360 / 7, 5);
  });

  it('defines each icon path once in a sprite', () => {
    const { container } = render(
      <SkillsSection
        heading={home.skills.heading}
        tiers={listSkillTiers(skills)}
        orbitCenterLabel="MB"
      />,
    );

    const symbolIds = [...container.querySelectorAll('symbol')].map((symbol) => symbol.id);
    expect(symbolIds).toContain('simple-icon-react');
    expect(new Set(symbolIds).size).toBe(symbolIds.length);
    expect(container.querySelectorAll('symbol path')).toHaveLength(symbolIds.length);
    expect(container.querySelectorAll('path')).toHaveLength(symbolIds.length);
  });
});
