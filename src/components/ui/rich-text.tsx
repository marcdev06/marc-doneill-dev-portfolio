import { Fragment } from 'react';
import type { TextSegment } from '@/lib/content';

interface RichTextProps {
  segments: readonly TextSegment[];
  linkClassName?: string;
}

export function RichText({ segments, linkClassName }: RichTextProps) {
  return segments.map((segment, segmentIndex) =>
    segment.href ? (
      <a key={segmentIndex} className={linkClassName} href={segment.href}>
        {segment.text}
      </a>
    ) : (
      <Fragment key={segmentIndex}>{segment.text}</Fragment>
    ),
  );
}
