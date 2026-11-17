import { Schema, model } from 'mongoose';

const aiCacheSchema = new Schema({
  key: { type: String, required: true, unique: true },
  result: { type: String, required: true },
  // Cached results expire on their own after two days
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 48 },
});

export const AiCache = model('AiCache', aiCacheSchema);