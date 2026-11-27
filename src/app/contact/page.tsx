"use client";

import React, { useState } from "react";
import { useStore } from "@/components/providers/StoreProviders";

export default function ContactPage() {
  const { toast } = useStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Could not send message.", "error");
        return;
      }
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      toast("Message sent! Our team will reply shortly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact AURA</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Questions about sizing, delivery, or an existing order? Send us a message.
        </p>
      </div>

      {sent ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
          <p className="font-bold">Thank you for reaching out!</p>
          <p className="text-sm">Our Dhaka support team will get back to you soon.</p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-xs font-semibold underline pt-1"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 border border-neutral-200 rounded-2xl bg-white space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="tel"
              placeholder="Phone (Optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
            <input
              type="text"
              required
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <textarea
            required
            rows={4}
            placeholder="How can we help?"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-neutral-950 text-white text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}
