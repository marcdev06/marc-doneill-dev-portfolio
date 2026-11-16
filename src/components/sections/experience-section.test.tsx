import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { experience } from '@/content/experience';
import { ExperienceSection } from './experience-section';

describe('ExperienceSection', () => {
  it('lists companies newest first under the experience anchor', () => {
    render(<ExperienceSection heading="Experience" entries={experience} />);

    const section = screen.getByRole('region', { name: 'Experience' });
    expect(section).toHaveAttribute('id', 'experience');
    expect(
      within(section)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(['KwikCare', 'Singlife Philippines', 'Workbean']);
  });

  it('links KwikCare and marks the current role as present', () => {
    render(<ExperienceSection heading="Experience" entries={experience} />);

    const kwikCareCard = screen.getByRole('article', { name: 'KwikCare' });
    expect(within(kwikCareCard).getByRole('link', { name: 'KwikCare' })).toHaveAttribute(
      'href',
      'https://kwik.care/kwikcare',
    );
    expect(kwikCareCard).toHaveTextContent(
      'A digital insurance brokerage and subscription-based HMO (Health Maintenance Organization) provider in the Philippines',
    );
    expect(screen.getByRole('article', { name: 'Singlife Philippines' })).toHaveTextContent(
      'A mobile-first, digital life insurance and financial services company in the Philippines',
    );
    expect(kwikCareCard).toHaveTextContent('Sep 2025 – Present');
    expect(kwikCareCard.querySelector('time')).toHaveAttribute('dateTime', '2025-09');
  });

  it('stacks both Workbean roles with machine-readable dates', () => {
    render(<ExperienceSection heading="Experience" entries={experience} />);

    const workbeanCard = screen.getByRole('article', { name: 'Workbean' });
    const roleItems = within(workbeanCard)
      .getAllByRole('listitem')
      .filter((listItem) => listItem.querySelector('time'));
    expect(roleItems.map((roleItem) => roleItem.textContent)).toEqual([
      'Software EngineerJun 2022 – Mar 2023',
      'Software Engineer InternMar 2022 – Jun 2022',
    ]);
    expect(
      [...workbeanCard.querySelectorAll('time')].map((timeElement) =>
        timeElement.getAttribute('dateTime'),
      ),
    ).toEqual(['2022-06', '2023-03', '2022-03', '2022-06']);
    expect(within(workbeanCard).queryByRole('link')).toBeNull();
  });
});
