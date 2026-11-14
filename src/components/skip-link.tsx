interface SkipLinkProps {
  targetId: string;
}

export function SkipLink({ targetId }: SkipLinkProps) {
  return (
    <a
      className="visually-hidden-focusable position-absolute top-0 start-0 z-3 m-2 px-3 py-2 bg-body border rounded"
      href={`#${targetId}`}
    >
      Skip to main content
    </a>
  );
}
