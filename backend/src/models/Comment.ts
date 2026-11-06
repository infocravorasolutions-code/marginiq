import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  entityType: 'PRODUCT' | 'ORDER' | 'SETTLEMENT' | 'REPORT' | 'ALERT';
  entityId: string;
  body: string;
  mentions?: string[];
}

const CommentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: { 
      type: String, 
      enum: ['PRODUCT', 'ORDER', 'SETTLEMENT', 'REPORT', 'ALERT'], 
      required: true 
    },
    entityId: { type: String, required: true },
    body: { type: String, required: true },
    mentions: [{ type: String }],
  },
  { timestamps: true }
);

CommentSchema.index({ organizationId: 1, entityType: 1, entityId: 1 });
CommentSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
