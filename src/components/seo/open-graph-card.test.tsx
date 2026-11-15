import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OpenGraphCard, splitHeadline } from './open-graph-card';

const headline = {
  beforeHighlight: 'Building software that makes life easier for ',
  highlight: 'every Filipino',
  afterHighlight: '.',
};

describe('splitHeadline', () => {
  it('marks the highlighted words and keeps the period on the last one', () => {
    expect(splitHeadline(headline).slice(-3)).toEqual([
      { word: 'for', isHighlighted: false, trailingText: '' },
      { word: 'every', isHighlighted: true, trailingText: '' },
      { word: 'Filipino', isHighlighted: true, trailingText: '.' },
    ]);
  });

  it('keeps words after the highlight as plain words', () => {
    expect(
      splitHeadline({ beforeHighlight: 'Building ', highlight: 'calm', afterHighlight: ' tools.' }),
    ).toEqual([
      { word: 'Building', isHighlighted: false, trailingText: '' },
      { word: 'calm', isHighlighted: true, trailingText: '' },
      { word: 'tools.', isHighlighted: false, trailingText: '' },
    ]);
  });
});

describe('OpenGraphCard', () => {
  it('shows the photo, name, role, mission line and site host', () => {
    render(
      <OpenGraphCard
        name="Marc Doneill Balatayo"
        role="Full-Stack Software Engineer"
        headline={headline}
        host="marc-doneill-dev-portfolio.vercel.app"
        photoSrc="data:image/jpeg;base64,AAAA"
        photoAlt="Portrait of Marc"
      />,
    );

    expect(screen.getByRole('img', { name: 'Portrait of Marc' })).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,AAAA',
    );
    for (const visibleText of [
      'Marc Doneill Balatayo',
      'Full-Stack Software Engineer',
      'marc-doneill-dev-portfolio.vercel.app',
    ]) {
      expect(screen.getByText(visibleText)).toBeInTheDocument();
    }
    expect(screen.getByText('every')).toHaveStyle({ color: '#e3a76f' });
    expect(screen.getByText('Filipino')).toHaveStyle({ color: '#e3a76f' });
    expect(screen.getByText('Building')).not.toHaveStyle({ color: '#e3a76f' });
  });
});
