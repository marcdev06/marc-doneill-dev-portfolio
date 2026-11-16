import type { SimpleIcon } from 'simple-icons';

function toSymbolId(icon: SimpleIcon): string {
  return `simple-icon-${icon.slug}`;
}

interface SimpleIconSpriteProps {
  icons: readonly SimpleIcon[];
}

export function SimpleIconSprite({ icons }: SimpleIconSpriteProps) {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="position-absolute">
      <defs>
        {icons.map((icon) => (
          <symbol id={toSymbolId(icon)} viewBox="0 0 24 24" key={icon.slug}>
            <path d={icon.path} />
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

interface SimpleIconMarkProps {
  icon: SimpleIcon;
  className?: string;
}

export function SimpleIconMark({ icon, className }: SimpleIconMarkProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
    >
      <use href={`#${toSymbolId(icon)}`} />
    </svg>
  );
}
