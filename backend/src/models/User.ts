import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'ANALYST' | 'VIEWER';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  organizationId: mongoose.Types.ObjectId;
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'OWNER', 'MANAGER', 'ANALYST', 'VIEWER'],
      default: 'USER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INVITED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

// Indexes for performance
UserSchema.index({ organizationId: 1 });

export default mongoose.model<IUser>('User', UserSchema);
