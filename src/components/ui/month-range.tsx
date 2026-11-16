import { formatIsoMonth } from '@/lib/content';

interface MonthRangeProps {
  start: string;
  end?: string;
  className?: string;
}

export function MonthRange({ start, end, className }: MonthRangeProps) {
  return (
    <span className={className}>
      <time dateTime={start}>{formatIsoMonth(start)}</time>
      {' – '}
      {end ? <time dateTime={end}>{formatIsoMonth(end)}</time> : 'Present'}
    </span>
  );
}
