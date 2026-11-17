import type { ThreadDocument } from '../models/Thread.js';
import { CONFIDENCE_THRESHOLD } from './segments.js';

export function effectiveResponsibility(t: ThreadDocument) {
  return t.override?.responsibility ?? t.ai?.responsibility ?? null;
}

export function toListDto(t: ThreadDocument) {
  const confidence = t.ai?.confidence ?? null;

  return {
    id: t.id as string,
    subject: t.subject,
    snippet: t.snippet,
    contact: t.participants[0]
      ? { name: t.participants[0].name, email: t.participants[0].email }
      : null,
    lastMessageAt: t.lastMessageAt,
    messageCount: t.messages.length,
    isRead: t.isRead,
    isImportant: t.isImportant,
    isArchived: t.isArchived,
    status: t.status,
    responsibility: effectiveResponsibility(t),
    classifiedBy: t.override ? ('manual' as const) : t.ai ? ('ai' as const) : null,
    confidence,
    needsReview: !t.override && confidence !== null && confidence < CONFIDENCE_THRESHOLD,
    ai: t.ai
      ? {
          summary: t.ai.summary ?? null,
          reason: t.ai.reason ?? null,
          category: t.ai.category ?? null,
          actionRequired: t.ai.actionRequired ?? false,
          waitingForReply: t.ai.waitingForReply ?? false,
          extractedDates: (t.ai.extractedDates ?? []).map((d) => ({
            label: d.label ?? '',
            date: d.date ?? null,
            kind: d.kind ?? 'other',
          })),
        }
      : null,
  };
}

export function toDetailDto(t: ThreadDocument) {
  return {
    ...toListDto(t),
    participants: t.participants.map((p) => ({ name: p.name, email: p.email })),
    clientDecision: t.clientDecision
      ? { action: t.clientDecision.action, note: t.clientDecision.note, at: t.clientDecision.at }
      : null,
    messages: t.messages.map((m) => ({
      id: String(m._id),
      fromName: m.fromName,
      fromEmail: m.fromEmail,
      to: m.to,
      body: m.body,
      sentAt: m.sentAt,
      direction: m.direction,
    })),
  };
}