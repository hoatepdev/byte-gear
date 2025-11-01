import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { UserRole } from 'src/auth/enums/user-role.enum';
import { AccountStatus } from 'src/auth/enums/account-status.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  password?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: AccountStatus,
    default: AccountStatus.UNVERIFIED,
  })
  status: AccountStatus;

  @Prop()
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Database Indexes for Performance Optimization
// email already has unique index from @Prop({ unique: true })
UserSchema.index({ role: 1 }); // For filtering users by role (admin queries)
UserSchema.index({ status: 1 }); // For filtering by account status
UserSchema.index({ createdAt: -1 }); // For sorting by registration date (newest first)
UserSchema.index({ role: 1, status: 1 }); // Compound index for admin dashboards
