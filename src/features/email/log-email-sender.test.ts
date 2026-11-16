import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmailSender } from './email-sender';
import { createLogEmailSender } from './log-email-sender';

const outgoingEmail = {
  subject: 'Resume request from Jane Doe',
  replyTo: 'jane@example.com',
  text: 'Approve or deny it here:\nhttps://ada.example.com/resume-requests/abc?token=xyz',
};

const expectedLog = [
  '[email] CONTACT_DELIVERY=log, so this email was logged, not sent:',
  'Subject: Resume request from Jane Doe',
  'Reply-To: jane@example.com',
  '',
  'Approve or deny it here:',
  'https://ada.example.com/resume-requests/abc?token=xyz',
].join('\n');

describe('createLogEmailSender', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
      temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('writes the email to the server log instead of sending it', async () => {
    const writeLogLine = vi.fn();

    await createLogEmailSender({ writeLogLine }).sendEmail(outgoingEmail);

    expect(writeLogLine).toHaveBeenCalledWith(expectedLog);
  });

  it('also appends it to the log file, where e2e reads review links', async () => {
    const logDirectory = await mkdtemp(path.join(tmpdir(), 'log-email-sender-'));
    temporaryDirectories.push(logDirectory);
    const logFilePath = path.join(logDirectory, 'emails.log');

    const sender = createLogEmailSender({ logFilePath, writeLogLine: vi.fn() });
    await sender.sendEmail(outgoingEmail);
    await sender.sendEmail(outgoingEmail);

    expect(await readFile(logFilePath, 'utf8')).toBe(`${expectedLog}\n\n${expectedLog}\n\n`);
  });

  it('logs to the console by default', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await createEmailSender({ mode: 'log' }).sendEmail(outgoingEmail);

    expect(consoleInfo).toHaveBeenCalledWith(expectedLog);
  });
});
