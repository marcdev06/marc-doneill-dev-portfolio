const manilaTimeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Manila',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatManilaTime(epochMs: number): string {
  return `${manilaTimeFormat.format(new Date(epochMs))} (Manila time)`;
}
