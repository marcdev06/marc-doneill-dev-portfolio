import { serializeJsonLd } from '@/lib/seo';

interface JsonLdProps {
  structuredData: object;
}

export function JsonLd({ structuredData }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
    />
  );
}
