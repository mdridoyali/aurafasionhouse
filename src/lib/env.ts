export const env = {
  get mongodbUri(): string {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI environment variable.");
    }
    return uri;
  },
  get firebaseProjectId(): string {
    return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  },
  get firebaseClientEmail(): string {
    return process.env.FIREBASE_CLIENT_EMAIL || "";
  },
  get firebasePrivateKey(): string {
    return (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  },
  get cloudinaryCloudName(): string {
    return process.env.CLOUDINARY_CLOUD_NAME || "";
  },
  get cloudinaryApiKey(): string {
    return process.env.CLOUDINARY_API_KEY || "";
  },
  get cloudinaryApiSecret(): string {
    return process.env.CLOUDINARY_API_SECRET || "";
  },
  get initialAdminEmail(): string {
    return (process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
  },
  get siteUrl(): string {
    return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  },
};
