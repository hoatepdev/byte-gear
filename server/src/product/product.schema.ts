import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Reply {
  @Prop({ type: String, default: () => new Types.ObjectId().toString() })
  _id: string;

  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  likes: string[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

@Schema()
export class Comment {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: [String], default: [] })
  likes: string[];

  @Prop({ type: [Reply], default: [] })
  replies: Reply[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  discountPrice: number;

  @Prop({ required: true, min: 0, max: 100 })
  discountPercent: number;

  @Prop()
  description?: string;

  @Prop({
    type: [String],
    required: true,
    validate: [
      (val: string[]) => val.length > 0,
      'At least one image is required',
    ],
  })
  images: string[];

  @Prop({ type: Map, of: MongooseSchema.Types.Mixed })
  attributes: Record<string, any>;

  @Prop({ type: [Comment], default: [] })
  comments: Comment[];

  @Prop({ type: Number, default: 0 })
  averageRating: number;

  @Prop({ type: Number, default: 0 })
  ratingsCount: number;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ type: Number, default: 0, min: 0 })
  soldQuantity: number;

  @Prop()
  event?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Database Indexes for Performance Optimization
ProductSchema.index({ slug: 1 }, { unique: true }); // Unique slug for SEO URLs
ProductSchema.index({ category: 1 }); // Filter by category (most common query)
ProductSchema.index({ price: 1 }); // Sort by price (low to high)
ProductSchema.index({ price: -1 }); // Sort by price (high to low)
ProductSchema.index({ averageRating: -1 }); // Sort by rating (highest first)
ProductSchema.index({ soldQuantity: -1 }); // Sort by popularity/best sellers
ProductSchema.index({ createdAt: -1 }); // Sort by newest products
ProductSchema.index({ event: 1 }); // Filter by promotional events
ProductSchema.index({ stock: 1 }); // Check stock availability

// Compound indexes for common query patterns
ProductSchema.index({ category: 1, price: 1 }); // Category + price filter
ProductSchema.index({ category: 1, averageRating: -1 }); // Category + top rated
ProductSchema.index({ category: 1, soldQuantity: -1 }); // Category + best sellers
ProductSchema.index({ event: 1, createdAt: -1 }); // Event products sorted by date

// Text search index for product name and description
ProductSchema.index({ name: 'text', description: 'text' }); // Full-text search
