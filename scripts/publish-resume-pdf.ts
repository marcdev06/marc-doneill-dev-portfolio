import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import { readRedisCredentials } from '../src/lib/request-store/request-store-config.ts';
import { publishedResumeKey, type PublishedResume } from '../src/lib/request-store/store-keys.ts';

const projectRoot = path.resolve(import.meta.dirname, '..');
const localEnvironmentPath = path.join(projectRoot, '.env.local');
const outputDirectory = path.join(projectRoot, '.resume');
const metaPath = path.join(projectRoot, 'src', 'content', 'resume.meta.json');

interface ResumeMeta {
  contentHash: string;
  fileName: string;
  generatedAt: string;
}

async function publishResumePdf() {
  if (existsSync(localEnvironmentPath)) {
    process.loadEnvFile(localEnvironmentPath);
  }
  const credentials = readRedisCredentials(process.env);
  if (!credentials) {
    throw new Error(
      'Set KV_REST_API_URL and KV_REST_API_TOKEN (or the UPSTASH_REDIS_REST_* pair) in .env.local.',
    );
  }

  const resumeMeta = JSON.parse(await readFile(metaPath, 'utf8')) as ResumeMeta;
  const pdfPath = path.join(outputDirectory, resumeMeta.fileName);
  if (!existsSync(pdfPath)) {
    throw new Error(
      `${path.relative(projectRoot, pdfPath)} is missing; run npm run resume:pdf first.`,
    );
  }
  const pdfBytes = await readFile(pdfPath);
  const publishedResume: PublishedResume = {
    pdfBase64: pdfBytes.toString('base64'),
    contentHash: resumeMeta.contentHash,
    generatedAt: resumeMeta.generatedAt,
  };

  const redis = new Redis(credentials);
  await redis.set(publishedResumeKey, publishedResume);
  console.log(
    `Published ${resumeMeta.fileName} (${String(pdfBytes.length)} bytes, generated ${resumeMeta.generatedAt}).`,
  );
}

await publishResumePdf();
