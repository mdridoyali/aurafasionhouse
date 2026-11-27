"use client";

import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useStore } from "@/components/providers/StoreProviders";

export function CloudinaryUploadButton({
  folder = "aura-fashion/products",
  onUploaded,
  label = "Upload Image",
}: {
  folder?: "aura-fashion/products" | "aura-fashion/banners" | "aura-fashion/categories";
  onUploaded: (result: { url: string; publicId: string }) => void;
  label?: string;
}) {
  const { toast } = useStore();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, mimeType: file.type, fileSize: file.size }),
      });
      const signJson = await signRes.json();
      if (!signRes.ok) {
        toast(signJson.error || "Upload authorization failed.", "error");
        return;
      }

      const { signature, timestamp, cloudName, apiKey } = signJson.data;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const cldRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const cldJson = await cldRes.json();
      if (!cldRes.ok || !cldJson.public_id) {
        toast(cldJson.error?.message || "Cloudinary upload failed.", "error");
        return;
      }

      // Server-side verification of uploaded asset
      const verifyRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: cldJson.public_id }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok) {
        toast(verifyJson.error || "Uploaded image failed validation.", "error");
        return;
      }

      onUploaded({ url: verifyJson.data.url, publicId: cldJson.public_id });
      toast("Image uploaded!");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => void handleFile(e)}
        className="hidden"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold disabled:opacity-60"
      >
        <Upload className="w-3.5 h-3.5" />
        {uploading ? "Uploading..." : label}
      </button>
    </>
  );
}
