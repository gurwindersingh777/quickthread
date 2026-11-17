
import { env } from '../../config/env.js';
import { groqJson, type ChatMessage } from './groq.js';
import { rawClassificationSchema, type Classification } from './schema.js';

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
  now: Date;
  messages: ClassifyMessage[];
};

const MAX_MESSAGES = 8;
const MAX_BODY_CHARS = 1200;

function authorLabel(m: ClassifyMessage) {
  if (m.direction === 'incoming') return `RECEIVED from ${m.fromName}`;
  return m.fromName.includes('(for') ? 'SENT BY ASSISTANT' : 'SENT BY CLIENT';
}

function buildSystemPrompt(input: ClassifyInput) {
  return `You are the email triage engine inside Quickthread, a tool for personal assistants who manage a busy executive's mailbox.

Your job: read ONE email conversation and decide who must reply NEXT, then extract useful structure.

PEOPLE
- Client: ${input.clientName}, the owner of the mailbox.
- Assistant: ${input.assistantName}, who manages the mailbox on the client's behalf. Messages marked SENT BY ASSISTANT were written by the assistant for the client.

DECISION: "responsibility"
- "assistant": the assistant should handle the next reply. Scheduling and rescheduling, routine business or vendor questions, invoices and logistics, collecting or sending information, following up on pending requests, general administration.
- "client": only the client can answer. Decisions or approvals, sensitive business, legal, financing, leadership hiring, strategy, requests for the client's personal opinion, or anything that explicitly asks the client to decide.
- "none": no reply is needed now. Newsletters, automated notifications and receipts, calendar acceptances, FYIs and status updates, resolved threads (the last message is a thanks or a confirmation), and threads where our side wrote last and we are simply waiting for the other party.

RULES
1. Judge the state of the conversation NOW, using the whole history. Earlier messages may already have been answered.
2. Do not assume every email needs a reply. Prefer "none" when nothing is being asked of us.
3. If we are waiting for the other party, set waitingForReply to true. If the wait has been several days or follow-ups went unanswered, responsibility is "assistant" (to follow up) and waitingForReply stays true.
4. If the assistant already escalated the matter to the client, or the ask truly needs the client, the owner stays "client".
5. When intent is unclear (a forward with no context, a vague message from an unknown sender, a request mixing routine work with a significant decision), choose your best guess and set confidence below 0.7.
6. Confidence: 0.9 or higher when the case is clear, 0.7 to 0.89 when likely, below 0.7 when genuinely ambiguous. Do not inflate it.

OTHER FIELDS
- reason: one short sentence explaining why this owner, referring to specifics from the email.
- summary: one or two neutral sentences in plain language.
- category: one of meeting, scheduling, finance, legal, hiring, general.
- actionRequired: true if someone on our side must do something (reply, decide, send, pay, follow up). False for purely informational email.
- dates: dates or times that matter (meetings, deadlines). Resolve words like "tomorrow" or "Thursday" using the message timestamp. Use ISO 8601 in UTC. kind is meeting, deadline, or other. Use an empty array if there are none.

Reply with a single JSON object and nothing else, using exactly these keys:
{"responsibility": "assistant", "confidence": 0.0, "reason": "", "summary": "", "category": "general", "actionRequired": false, "waitingForReply": false, "dates": [{"label": "", "iso": "", "kind": "meeting"}]}`;
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

      const classification: Classification = {
        responsibility: raw.responsibility,
        confidence: raw.confidence,
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