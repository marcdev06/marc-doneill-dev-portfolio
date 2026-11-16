export const mainContentId = 'main-content';

interface SkipLinkProps {
  targetId: string;
}

export function SkipLink({ targetId }: SkipLinkProps) {
  return (
    <a
      className="pf-skip-link visually-hidden-focusable position-absolute top-0 start-0 m-2 px-3 py-2 bg-body border rounded d-print-none"
      href={`#${targetId}`}
    >
      Skip to main content
    </a>
  );
}
