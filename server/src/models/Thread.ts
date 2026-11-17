import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const RESPONSIBILITIES = ['assistant', 'client', 'none'] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const THREAD_STATUSES = ['open', 'waiting', 'done'] as const;

const personSchema = new Schema(
  { name: { type: String, default: '' }, email: { type: String, required: true } },
  { _id: false },
);

const messageSchema = new Schema({
  fromName: { type: String, required: true },
  fromEmail: { type: String, required: true },
  to: { type: [String], default: [] },
  body: { type: String, required: true },
  sentAt: { type: Date, required: true },
  direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
});

const aiSchema = new Schema(
  {
    responsibility: { type: String, enum: [...RESPONSIBILITIES] },
    confidence: { type: Number },
    reason: { type: String },
    uncertainty: { type: [String], default: [] },
    model: { type: String },
    summary: { type: String },
    category: { type: String },
    actionRequired: { type: Boolean },
    waitingForReply: { type: Boolean },
    extractedDates: {
      type: [
        new Schema(
          { label: String, date: Date, kind: String },
          { _id: false },
        ),
      ],
      default: [],
    },
    classifiedAt: { type: Date },
    classifiedMessageCount: { type: Number },
  },
  { _id: false },
);

const overrideSchema = new Schema(
  {
    responsibility: { type: String, enum: [...RESPONSIBILITIES], required: true },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const clientDecisionSchema = new Schema(
  {
    action: { type: String, enum: ['handled', 'handoff'], required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const analysisSchema = new Schema(
  {
    status: { type: String, enum: ['pending', 'done', 'failed'], required: true },
    error: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const threadSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'EmailAccount', required: true },
    subject: { type: String, required: true },
    participants: { type: [personSchema], default: [] },
    snippet: { type: String, default: '' },
    lastMessageAt: { type: Date, required: true },
    messages: { type: [messageSchema], default: [] },
    isRead: { type: Boolean, default: true },
    isImportant: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    status: { type: String, enum: [...THREAD_STATUSES], default: 'open' },
    ai: { type: aiSchema, default: undefined },
    analysis: { type: analysisSchema, default: undefined },
    override: { type: overrideSchema, default: undefined },
    clientDecision: { type: clientDecisionSchema, default: undefined },
  },
  { timestamps: true },
);

threadSchema.index({ ownerId: 1, lastMessageAt: -1 });
threadSchema.index({ accountId: 1 });

export type ThreadDocument = HydratedDocument<InferSchemaType<typeof threadSchema>>;
export const Thread = model('Thread', threadSchema);