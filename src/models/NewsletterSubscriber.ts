import "server-only";
import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface INewsletterSubscriber extends Document {
  email: string;
  createdAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const NewsletterSubscriber: Model<INewsletterSubscriber> =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model<INewsletterSubscriber>("NewsletterSubscriber", NewsletterSubscriberSchema);
