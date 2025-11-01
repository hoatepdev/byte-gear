import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true, enum: ['CUSTOMER', 'ADMIN'] })
  sender: 'CUSTOMER' | 'ADMIN';

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  roomId: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Number, default: 0 })
  unreadCount: number;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = Chat & Document<Types.ObjectId>;

// Database Indexes for Performance Optimization
ChatSchema.index({ roomId: 1 }); // Get all messages in a room (most common query)
ChatSchema.index({ userId: 1 }); // Get messages from a specific user
ChatSchema.index({ createdAt: -1 }); // Sort messages by time (newest first)
ChatSchema.index({ isRead: 1 }); // Filter unread messages
ChatSchema.index({ isDeleted: 1 }); // Exclude deleted messages

// Compound indexes for common query patterns
ChatSchema.index({ roomId: 1, createdAt: 1 }); // Room messages sorted chronologically
ChatSchema.index({ roomId: 1, isRead: 1 }); // Unread messages in a room
ChatSchema.index({ userId: 1, isDeleted: 1 }); // User's active messages
