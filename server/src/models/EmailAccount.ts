import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const PROVIDERS = ['gmail', 'outlook'] as const;
export type Provider = (typeof PROVIDERS)[number];

const emailAccountSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: [...PROVIDERS], required: true },
    address: { type: String, required: true },
    displayName: { type: String, default: '' },
    status: { type: String, enum: ['connected', 'syncing', 'error'], default: 'connected' },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true },
);

// One account per provider per assistant
emailAccountSchema.index({ ownerId: 1, provider: 1 }, { unique: true });

export type EmailAccountDocument = HydratedDocument<InferSchemaType<typeof emailAccountSchema>>;
export const EmailAccount = model('EmailAccount', emailAccountSchema);