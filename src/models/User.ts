import "server-only";
import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { UserRole } from "@/lib/auth/rbac";

export interface IAddress {
  _id: Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  street: string;
  isInsideDhaka: boolean;
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  emailVerified: boolean;
  role: UserRole;
  isBlocked: boolean;
  addresses: IAddress[];
  wishlist: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    label: { type: String, required: true, trim: true, maxlength: 40 },
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    division: { type: String, required: true, trim: true, maxlength: 50 },
    district: { type: String, required: true, trim: true, maxlength: 50 },
    area: { type: String, required: true, trim: true, maxlength: 80 },
    street: { type: String, required: true, trim: true, maxlength: 200 },
    isInsideDhaka: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    photoURL: { type: String, trim: true },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "moderator", "admin"], default: "user", index: true },
    isBlocked: { type: Boolean, default: false },
    addresses: { type: [AddressSchema], default: [] },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
