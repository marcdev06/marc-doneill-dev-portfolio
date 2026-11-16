import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { JsonLd } from './json-ld';

it('renders escaped structured data in a JSON-LD script', () => {
  const { container } = render(
    <JsonLd structuredData={{ '@type': 'Person', name: 'Ada </script> Example' }} />,
  );

  const jsonLdScript = container.querySelector('script[type="application/ld+json"]');
  expect(jsonLdScript?.innerHTML).toBe('{"@type":"Person","name":"Ada \\u003c/script> Example"}');
  expect(JSON.parse(jsonLdScript?.textContent ?? '')).toEqual({
    '@type': 'Person',
    name: 'Ada </script> Example',
  });
});
