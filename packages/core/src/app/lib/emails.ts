import {
  emailCreatedAt as createdAt,
  emailIds as ids,
  emailMeta as meta,
} from 'virtual:open-pages/emails';

export type EmailInfo = { title: string; subject: string | null; description: string | null };

export const emailIds: string[] = ids;
export const emailMeta: Record<string, EmailInfo> = meta;
export const emailCreatedAt: Record<string, number> = createdAt;

export function emailChangeIncludes(data: unknown, emailId: string): boolean {
  if (!data || typeof data !== 'object') return false;
  const payload = data as { emailIds?: unknown };
  return Array.isArray(payload.emailIds) && payload.emailIds.includes(emailId);
}
