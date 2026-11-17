import { env } from '../../config/env.js';
import { groqJson, type ChatMessage } from './groq.js';
import {
  isUncertaintyFlag,
  rawClassificationSchema,
  type Classification,
  type UncertaintyFlag,
} from './schema.js';

export type ClassifyMessage = {
  direction: 'incoming' | 'outgoing';
  fromName: string;
  sentAt: Date;
  body: string;
};

export type ClassifyInput = {
  subject: string;
  clientName: string;
  assistantName: string;
  mailbox: string;
  /** Email address of the other party in the conversation */
  contactEmail: string;
  now: Date;
  messages: ClassifyMessage[];
};

const MAX_MESSAGES = 8;
const MAX_BODY_CHARS = 1200;
export const PROMPT_VERSION = 'v6';
// Money commitments an AI should never settle silently: renewals, price increases, contracts
const COMMITMENT_LANGUAGE =
  /\b(renew\w*|price (?:increase|hike)|rate (?:increase|hike)|\d+% (?:price |rate )?increase|contract|subscription)\b/i;

// Models rate their own confidence too generously, so each uncertainty flag caps it
const CAP_ONE_FLAG = 0.6;
const CAP_TWO_OR_MORE_FLAGS = 0.45;

const FREE_MAIL = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
]);

const FORWARD_MARKER = /-{3,}\s*forwarded message|^\s*begin forwarded message/im;
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Uncertainty signals we can verify ourselves, without trusting the model.
 * They only apply when someone is expected to reply, so notifications are never flagged.
 */
function computeSignals(input: ClassifyInput, responsibility: Classification['responsibility']) {
  const flags = new Set<UncertaintyFlag>();
  if (responsibility === 'none') return flags;

  const incoming = input.messages.filter((m) => m.direction === 'incoming');
  const last = incoming[incoming.length - 1];
  if (!last) return flags;

  const domain = input.contactEmail.split('@')[1]?.toLowerCase() ?? '';
  const neverWroteBack = !input.messages.some((m) => m.direction === 'outgoing');
  const unknownSender = FREE_MAIL.has(domain) && neverWroteBack;

  const isForward = FORWARD_MARKER.test(last.body);
  const ownText = isForward ? last.body.slice(last.body.search(FORWARD_MARKER)) && last.body.slice(0, last.body.search(FORWARD_MARKER)) : last.body;
  const forwardedWithLittleComment = isForward && wordCount(ownText) < 12;
  const veryShort = wordCount(last.body) < 25;

  if (unknownSender) flags.add('unknown_sender');
  if (forwardedWithLittleComment || (unknownSender && veryShort)) flags.add('missing_context');
  const mailboxDomain = input.mailbox.split('@')[1]?.toLowerCase() ?? '';
  const clientAlreadyReplied = input.messages.some(
    (m) => m.direction === 'outgoing' && !m.fromName.includes('(for'),
  );
  if (domain !== mailboxDomain && !clientAlreadyReplied && COMMITMENT_LANGUAGE.test(last.body)) {
    flags.add('authority_unclear');
  }
  return flags;
}

// Messages the assistant sends on the client's behalf are named "Alice (for James)"
function authorLabel(m: ClassifyMessage) {
  if (m.direction === 'incoming') return `RECEIVED from ${m.fromName}`;
  return m.fromName.includes('(for') ? 'SENT BY ASSISTANT' : 'SENT BY CLIENT';
}

function buildSystemPrompt(input: ClassifyInput) {
  return `You are the triage engine in Quickthread, a tool for personal assistants who manage an executive's mailbox. Read ONE email conversation and decide who must reply NEXT.

People: the client is ${input.clientName} (the mailbox owner); the assistant is ${input.assistantName}. Messages marked SENT BY ASSISTANT were written by the assistant for the client.

responsibility:
- "assistant": routine work the assistant can handle: scheduling or rescheduling, offering availability or time slots (even when the client will attend), vendor or logistics questions, routine finance admin (invoice questions, missing PO numbers, receipts, payment details, expense paperwork), sending or collecting information, follow-ups, general admin.
- "client": only the client can answer: decisions, approvals, sensitive business, legal, financing, leadership hiring, strategy, or a request for the client's personal opinion.
- "none": nothing to do now: newsletters, automated notices, calendar acceptances, FYIs, resolved threads (the last message is a thanks or a confirmation), or we already did what was asked and are just waiting.

Rules:
1. Judge the conversation as it stands NOW, using the full history.
2. A request is handled only when the person who must respond actually answered or did the thing. Acknowledgments and holding replies ("I'll flag this", "noted", "on the agenda") do not resolve it.
3. Do not assume every email needs a reply. Use "none" when nothing is asked of us.
4. If our side promised something that has not been done, someone owes work: "assistant", unless only the client can do it.
5. If we are waiting on the other party, set waitingForReply true. If the wait is several days or follow-ups went unanswered, the owner is "assistant" (to chase).
6. If the matter needs the client's authority, or was escalated to the client, keep "client".

uncertainty: list EVERY flag that applies (your confidence tends to run high, so flags matter more than the number): "unknown_sender" (unfamiliar person, no role or organization), "missing_context" (too little to tell what is being asked), "unclear_intent" (unclear what response is wanted), "authority_unclear" (the message seeks approval of NEW spending, a price change, a renewal, a contract or a commitment, and nothing shows who approved it; routine paperwork about money that is already agreed does not count)

Other fields: confidence (0 to 1); reason (one specific sentence); summary (one or two neutral sentences); category (meeting, scheduling, finance, legal, hiring, general); actionRequired (someone on our side must do something); waitingForReply; dates (meetings and deadlines resolved from message timestamps, ISO 8601 UTC, kind is meeting, deadline or other).

Return only a JSON object with exactly these keys:
{"responsibility": "assistant", "confidence": 0.0, "uncertainty": [], "reason": "", "summary": "", "category": "general", "actionRequired": false, "waitingForReply": false, "dates": [{"label": "", "iso": "", "kind": "meeting"}]}`;
}

function buildUserPrompt(input: ClassifyInput) {
  const recent = input.messages.slice(-MAX_MESSAGES);
  const omitted = input.messages.length - recent.length;

  const rendered = recent
    .map((m, i) => {
      const body =
        m.body.length > MAX_BODY_CHARS ? `${m.body.slice(0, MAX_BODY_CHARS)}…` : m.body;
      return `[${i + 1 + omitted}] ${authorLabel(m)} at ${m.sentAt.toISOString()}\n${body}`;
    })
    .join('\n\n');

  return `Current time: ${input.now.toISOString()}
Mailbox: ${input.mailbox}
Subject: ${input.subject}
${omitted > 0 ? `(${omitted} earlier messages omitted)\n` : ''}
Messages, oldest first:

${rendered}`;
}

export async function classifyConversation(input: ClassifyInput) {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(input) },
    { role: 'user', content: buildUserPrompt(input) },
  ];

  let tokens = 0;
  let lastError = '';

  // One automatic repair attempt if the JSON is malformed or fails validation
  for (let attempt = 0; attempt < 2; attempt++) {
    const { content, tokens: used } = await groqJson(messages);
    tokens += used;

    try {
      const raw = rawClassificationSchema.parse(JSON.parse(content));

      const extractedDates = raw.dates.flatMap((d) => {
        const date = new Date(d.iso);
        return Number.isNaN(date.getTime())
          ? []
          : [{ label: d.label.slice(0, 120), date, kind: d.kind }];
      });

      // The model's flags plus the ones we can verify ourselves
      const uncertainty = [
        ...new Set([...raw.uncertainty.filter(isUncertaintyFlag), ...computeSignals(input, raw.responsibility)]),
      ];
      const cap =
        uncertainty.length >= 2 ? CAP_TWO_OR_MORE_FLAGS : uncertainty.length === 1 ? CAP_ONE_FLAG : 1;

      const classification: Classification = {
        responsibility: raw.responsibility,
        confidence: Math.min(raw.confidence, cap),
        uncertainty,
        reason: raw.reason.slice(0, 500),
        summary: raw.summary.slice(0, 700),
        category: raw.category,
        actionRequired: raw.actionRequired,
        waitingForReply: raw.waitingForReply,
        extractedDates,
      };

      return { classification, tokens, model: env.GROQ_MODEL };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      messages.push(
        { role: 'assistant', content },
        {
          role: 'user',
          content: `That response was not valid (${lastError.slice(0, 300)}). Return only the corrected JSON object.`,
        },
      );
    }
  }

  throw new Error(`The model returned an invalid classification: ${lastError.slice(0, 200)}`);
}