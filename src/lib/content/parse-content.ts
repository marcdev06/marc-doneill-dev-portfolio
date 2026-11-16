import { z } from 'zod';

export function parseContent<Schema extends z.ZodType>(
  schema: Schema,
  content: z.input<Schema>,
  moduleName: string,
): z.output<Schema> {
  const parseResult = schema.safeParse(content);
  if (!parseResult.success) {
    throw new Error(`Invalid content in ${moduleName}:\n${z.prettifyError(parseResult.error)}`);
  }
  return parseResult.data;
}
