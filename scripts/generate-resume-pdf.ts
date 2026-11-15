import { type ChildProcess, spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { chromium } from '@playwright/test';

const projectRoot = path.resolve(import.meta.dirname, '..');
const nextCliPath = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const pdfPath = path.join(projectRoot, 'public', 'resume.pdf');
const metaPath = path.join(projectRoot, 'public', 'resume.meta.json');
const serverStartTimeoutMs = 60_000;
const a4HeightCssPixels = 1123;

function runNext(nextArguments: string[]): ChildProcess {
  return spawn(process.execPath, [nextCliPath, ...nextArguments], {
    cwd: projectRoot,
    stdio: 'inherit',
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

async function renderResumePdf(resumeUrl: string) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: a4HeightCssPixels } });
    await page.goto(resumeUrl, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.emulateMedia({ media: 'print' });

    const resumeSheet = page.locator('[data-content-hash]');
    const contentHash = await resumeSheet.getAttribute('data-content-hash');
    if (!contentHash) {
      throw new Error('The /resume page has no data-content-hash attribute');
    }
    const sheetHeight = await resumeSheet.evaluate((element) => element.scrollHeight);
    if (sheetHeight > a4HeightCssPixels) {
      throw new Error(`The resume is ${String(sheetHeight)}px tall; one A4 page fits 1123px`);
    }

    const pdfBytes = await page.pdf({ format: 'A4', printBackground: true });
    return { contentHash, pdfBytes };
  } finally {
    await browser.close();
  }
}

async function generateResumePdf() {
  await waitForSuccessfulExit(runNext(['build']));

  const port = await findFreePort();
  const server = runNext(['start', '--port', String(port), '--hostname', '127.0.0.1']);
  try {
    const resumeUrl = `http://127.0.0.1:${String(port)}/resume`;
    await waitForServer(resumeUrl);
    const { contentHash, pdfBytes } = await renderResumePdf(resumeUrl);

    await writeFile(pdfPath, pdfBytes);
    const resumeMeta = { contentHash, generatedAt: new Date().toISOString() };
    await writeFile(metaPath, `${JSON.stringify(resumeMeta, null, 2)}\n`);
    console.log(`Wrote public/resume.pdf (${String(pdfBytes.length)} bytes) and resume.meta.json`);
  } finally {
    server.kill();
  }
}

await generateResumePdf();
