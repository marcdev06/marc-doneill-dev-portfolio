import { describe, expect, it } from 'vitest';
import { buildProfileInput } from '../../../test/content-fixtures';
import { parseContent } from './parse-content';
import { profileSchema } from './profile-schema';

describe('parseContent', () => {
  it('returns the parsed content when it is valid', () => {
    const profile = parseContent(profileSchema, buildProfileInput(), 'profile fixture');

    expect(profile.name).toBe('Ada Example');
  });

  it('names the module, the field and the problem when content is invalid', () => {
    const invalidProfile = { ...buildProfileInput(), monogram: 'ab' };

    expect(() => parseContent(profileSchema, invalidProfile, 'src/content/profile.ts')).toThrow(
      /Invalid content in src\/content\/profile\.ts:\n.*Monogram must be two capital letters\n.*→ at monogram/,
    );
  });
});
