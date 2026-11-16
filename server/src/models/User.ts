import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['assistant', 'client'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    clerkId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    role: { type: String, enum: [...USER_ROLES], default: 'assistant', required: true },
    assistantId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);