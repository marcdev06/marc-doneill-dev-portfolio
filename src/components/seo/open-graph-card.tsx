import type { HeroContent } from '@/lib/content';

interface OpenGraphCardProps {
  name: string;
  role: string;
  headline: HeroContent['headline'];
  host: string;
  photoSrc: string;
  photoAlt: string;
}

export interface HeadlinePiece {
  text: string;
  isHighlighted: boolean;
}

export type HeadlineWord = HeadlinePiece[];

const openGraphColors = {
  canvas: '#0f1714',
  text: '#e8eeeb',
  mutedText: '#a9b8b3',
  accentText: '#8fc9b8',
  warm: '#e3a76f',
  tealGlow: 'rgba(70, 140, 120, 0.28)',
  warmGlow: 'rgba(227, 167, 111, 0.14)',
  photoRing: 'rgba(143, 201, 184, 0.35)',
} as const;

const photoSizePixels = 300;
const photoRingPixels = 6;

// Whitespace splits words; text touching a word joins it
export function splitHeadline(headline: HeroContent['headline']): HeadlineWord[] {
  const segments = [
    { text: headline.beforeHighlight, isHighlighted: false },
    { text: headline.highlight, isHighlighted: true },
    { text: headline.afterHighlight, isHighlighted: false },
  ];
  const words: HeadlineWord[] = [];
  let currentWord: HeadlineWord = [];
  for (const segment of segments) {
    for (const token of segment.text.split(/(\s+)/)) {
      if (/^\s+$/.test(token) && currentWord.length > 0) {
        words.push(currentWord);
        currentWord = [];
      } else if (/\S/.test(token)) {
        currentWord.push({ text: token, isHighlighted: segment.isHighlighted });
      }
    }
  }
  return currentWord.length > 0 ? [...words, currentWord] : words;
}

// Satori needs inline styles and one flex item per word
export function OpenGraphCard({
  name,
  role,
  headline,
  host,
  photoSrc,
  photoAlt,
}: OpenGraphCardProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 72px',
        fontFamily: 'Poppins',
        backgroundColor: openGraphColors.canvas,
        backgroundImage: [
          `radial-gradient(circle at 19% 50%, ${openGraphColors.tealGlow} 0%, ${openGraphColors.tealGlow} 14%, transparent 40%)`,
          `radial-gradient(circle at 96% 4%, ${openGraphColors.warmGlow} 0%, transparent 32%)`,
        ].join(', '),
      }}
    >
      <div
        style={{
          display: 'flex',
          flexShrink: 0,
          padding: photoRingPixels,
          borderRadius: '50%',
          border: `2px solid ${openGraphColors.photoRing}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img elements */}
        <img
          src={photoSrc}
          alt={photoAlt}
          width={photoSizePixels}
          height={photoSizePixels}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: 56 }}>
        <div style={{ fontSize: 26, fontWeight: 600, color: openGraphColors.accentText }}>
          {role}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.15,
            color: openGraphColors.text,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: 11,
            marginTop: 28,
            fontSize: 38,
            fontWeight: 700,
            lineHeight: 1.3,
            color: openGraphColors.text,
          }}
        >
          {splitHeadline(headline).map((headlineWord, wordIndex) => (
            <span key={String(wordIndex)} style={{ display: 'flex' }}>
              {headlineWord.map((headlinePiece, pieceIndex) => (
                <span
                  key={String(pieceIndex)}
                  style={{ color: headlinePiece.isHighlighted ? openGraphColors.warm : undefined }}
                >
                  {headlinePiece.text}
                </span>
              ))}
            </span>
          ))}
        </div>
        <div
          style={{ marginTop: 40, fontSize: 24, fontWeight: 600, color: openGraphColors.mutedText }}
        >
          {host}
        </div>
      </div>
    </div>
  );
}
