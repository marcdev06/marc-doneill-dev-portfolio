import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { chromium } from '@playwright/test';

const projectRoot = path.resolve(import.meta.dirname, '..');
const nextCliPath = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const localEnvironmentPath = path.join(projectRoot, '.env.local');
const outputDirectory = path.join(projectRoot, '.resume');
const metaPath = path.join(projectRoot, 'src', 'content', 'resume.meta.json');
const serverStartTimeoutMs = 60_000;
const a4WidthCssPixels = 794;
const a4HeightCssPixels = 1123;

function runNext(nextArguments: string[], contactEmail: string | undefined): ChildProcess {
  return spawn(process.execPath, [nextCliPath, ...nextArguments], {
    cwd: projectRoot,
    stdio: 'inherit',
    // Only this build sees the email; Vercel builds never do
    env: { ...process.env, RESUME_CONTACT_EMAIL: contactEmail ?? '' },
  });
}

function waitForSuccessfulExit(childProcess: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    childProcess.once('error', reject);
    childProcess.once('exit', (exitCode) => {
      if (exitCode === 0) {
        resolve();
      } else {
        reject(new Error(`next exited with code ${String(exitCode)}`));
      }
    });
  });
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probeServer = createServer();
    probeServer.once('error', reject);
    probeServer.listen(0, '127.0.0.1', () => {
      const address = probeServer.address();
      probeServer.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port);
        } else {
          reject(new Error('Could not find a free port'));
        }
      });
    });
  });
}

async function waitForServer(url: string): Promise<void> {
  const deadline = Date.now() + serverStartTimeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The server is not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${url} did not respond within ${String(serverStartTimeoutMs)} ms`);
}

function countPdfPages(pdfBytes: Buffer): number {
  return pdfBytes.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g)?.length ?? 0;
}

async function renderResumePdf(resumeUrl: string) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: a4WidthCssPixels, height: a4HeightCssPixels },
    });
    await page.goto(resumeUrl, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const resumeSheet = page.locator('[data-content-hash]');
    const contentHash = await resumeSheet.getAttribute('data-content-hash');
    const fileName = await resumeSheet.getAttribute('data-file-name');
    if (!contentHash || !fileName) {
      throw new Error('The /resume page needs data-content-hash and data-file-name attributes');
    }
    const sheetHeight = await resumeSheet.evaluate((sheetElement) => sheetElement.scrollHeight);
    if (sheetHeight > a4HeightCssPixels) {
      throw new Error(`The resume is ${String(sheetHeight)}px tall; one A4 page fits 1123px`);
    }

    const pdfBytes = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
      outline: true,
    });
    const pageCount = countPdfPages(pdfBytes);
    if (pageCount !== 1) {
      throw new Error(`The resume PDF has ${String(pageCount)} pages; it must have one`);
    }
    return { contentHash, fileName, pdfBytes };
  } finally {
    await browser.close();
  }
}

function readContactEmail(): string | undefined {
  if (existsSync(localEnvironmentPath)) {
    process.loadEnvFile(localEnvironmentPath);
  }
  const contactEmail = process.env.CONTACT_TO_EMAIL?.trim();
  return contactEmail === '' ? undefined : contactEmail;
}

async function generateResumePdf() {
  const contactEmail = readContactEmail();
  console.log(
    contactEmail
      ? 'The PDF includes the CONTACT_TO_EMAIL address.'
      : 'CONTACT_TO_EMAIL is not set, so the PDF has no email line.',
  );
  await waitForSuccessfulExit(runNext(['build'], contactEmail));

  const port = await findFreePort();
  const server = runNext(
    ['start', '--port', String(port), '--hostname', '127.0.0.1'],
    contactEmail,
  );
  try {
    const resumeUrl = `http://127.0.0.1:${String(port)}/resume`;
    await waitForServer(resumeUrl);
    const { contentHash, fileName, pdfBytes } = await renderResumePdf(resumeUrl);

    await mkdir(outputDirectory, { recursive: true });
    const pdfPath = path.join(outputDirectory, fileName);
    await writeFile(pdfPath, pdfBytes);
    const resumeMeta = { contentHash, fileName, generatedAt: new Date().toISOString() };
    await writeFile(metaPath, `${JSON.stringify(resumeMeta, null, 2)}\n`);
    console.log(
      `Wrote ${path.relative(projectRoot, pdfPath)} (${String(pdfBytes.length)} bytes) and src/content/resume.meta.json`,
    );
  } finally {
    server.kill();
  }
}

await generateResumePdf();
