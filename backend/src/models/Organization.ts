import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  subscriptionPlan: 'Free' | 'Starter' | 'Professional' | 'Business';
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    subscriptionPlan: {
      type: String,
      enum: ['Free', 'Starter', 'Professional', 'Business'],
      default: 'Free',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
