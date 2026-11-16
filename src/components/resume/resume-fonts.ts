import { Poppins } from 'next/font/google';

// Only the resume uses these weights, so home stays lean
export const resumeMediumFont = Poppins({
  weight: '500',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins-medium',
});

export const resumeItalicFont = Poppins({
  weight: '400',
  style: 'italic',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins-italic',
});
