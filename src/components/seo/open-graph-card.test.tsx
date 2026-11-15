import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OpenGraphCard, splitHeadline } from './open-graph-card';

const headline = {
  beforeHighlight: 'Building software that makes ',
  highlight: 'everyday life',
  afterHighlight: ' easier.',
};

const toPlainPiece = (text: string) => ({ text, isHighlighted: false });
const toHighlightedPiece = (text: string) => ({ text, isHighlighted: true });

describe('splitHeadline', () => {
  it('marks a highlight of several words in the middle of the headline', () => {
    expect(splitHeadline(headline)).toEqual([
      [toPlainPiece('Building')],
      [toPlainPiece('software')],
      [toPlainPiece('that')],
      [toPlainPiece('makes')],
      [toHighlightedPiece('everyday')],
      [toHighlightedPiece('life')],
      [toPlainPiece('easier.')],
    ]);
  });

  it('keeps punctuation that touches the highlight in the same word', () => {
    expect(
      splitHeadline({
        beforeHighlight: 'Making life easier for ',
        highlight: 'every Filipino',
        afterHighlight: '.',
      }).slice(-2),
    ).toEqual([[toHighlightedPiece('every')], [toHighlightedPiece('Filipino'), toPlainPiece('.')]]);
  });

  it('handles a highlight inside a word and stray whitespace', () => {
    expect(
      splitHeadline({ beforeHighlight: '  Re', highlight: 'think', afterHighlight: 'ing  it ' }),
    ).toEqual([
      [toPlainPiece('Re'), toHighlightedPiece('think'), toPlainPiece('ing')],
      [toPlainPiece('it')],
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
    expect(screen.getByText('everyday')).toHaveStyle({ color: '#e3a76f' });
    expect(screen.getByText('life')).toHaveStyle({ color: '#e3a76f' });
    expect(screen.getByText('easier.')).not.toHaveStyle({ color: '#e3a76f' });
    expect(screen.getByText('Building')).not.toHaveStyle({ color: '#e3a76f' });
  });
});
