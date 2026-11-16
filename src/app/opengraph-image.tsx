import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { OpenGraphCard } from '@/components/seo/open-graph-card';
import { home } from '@/content/home';
import { profile } from '@/content/profile';
import { site } from '@/content/site';
import { openGraphImage } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';

export const alt = site.openGraphImageAlt;
export const size = openGraphImage.size;
export const contentType = openGraphImage.contentType;

const fontDirectory = path.join(process.cwd(), 'assets', 'fonts', 'poppins');
const photoMimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

async function readPhotoDataUrl(photoPath: string): Promise<string> {
  const mimeType = photoMimeTypes[path.extname(photoPath).toLowerCase()];
  if (!mimeType) {
    throw new Error(`The Open Graph image can't embed ${photoPath}; use a JPEG or PNG`);
  }
  const photoBytes = await readFile(path.join(process.cwd(), 'public', photoPath));
  return `data:${mimeType};base64,${photoBytes.toString('base64')}`;
}

export default async function OpenGraphImage() {
  const [semiBoldFont, boldFont, photoDataUrl] = await Promise.all([
    readFile(path.join(fontDirectory, 'Poppins-SemiBold.ttf')),
    readFile(path.join(fontDirectory, 'Poppins-Bold.ttf')),
    readPhotoDataUrl(profile.photo.src),
  ]);

  return new ImageResponse(
    <OpenGraphCard
      name={profile.name}
      role={profile.title}
      headline={home.hero.headline}
      host={getSiteUrl().host}
      photoSrc={photoDataUrl}
      photoAlt={profile.photo.alt}
    />,
    {
      ...size,
      fonts: [
        { name: 'Poppins', data: semiBoldFont, weight: 600, style: 'normal' },
        { name: 'Poppins', data: boldFont, weight: 700, style: 'normal' },
      ],
    },
  );
}
