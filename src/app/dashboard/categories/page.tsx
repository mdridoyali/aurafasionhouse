"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/StoreProviders";
import { CloudinaryUploadButton } from "@/components/dashboard/CloudinaryUploadButton";

interface CategoryRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface BrandRow {
  _id: string;
  name: string;
  slug: string;
}

export default function DashboardCategoriesPage() {
  const { toast } = useStore();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catParent, setCatParent] = useState("");
  const [catImage, setCatImage] = useState("");
  const [catSort, setCatSort] = useState(0);

  const [brandName, setBrandName] = useState("");

  const loadData = useCallback(async () => {
    const [cRes, bRes] = await Promise.all([
      fetch("/api/categories?includeInactive=true", { cache: "no-store" }),
      fetch("/api/brands", { cache: "no-store" }),
    ]);
    const [cJson, bJson] = await Promise.all([cRes.json(), bRes.json()]);
    if (cJson.ok) setCategories(cJson.data.categories);
    if (bJson.ok) setBrands(bJson.data.brands);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadData());
  }, [loadData]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: catName,
        description: catDesc,
        parent: catParent || null,
        image: catImage || undefined,
        sortOrder: catSort,
        isActive: true,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Could not create category.", "error");
      return;
    }
    setCatName("");
    setCatDesc("");
    setCatImage("");
    toast("Category added!");
    void loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Could not delete category.", "error");
      return;
    }
    toast("Category deleted", "info");
    void loadData();
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: brandName, isActive: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Could not create brand.", "error");
      return;
    }
    setBrandName("");
    toast("Brand added!");
    void loadData();
  };

  const handleDeleteBrand = async (id: string) => {
    await fetch(`/api/brands/${id}`, { method: "DELETE" });
    toast("Brand deleted", "info");
    void loadData();
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Categories & Brands</h1>
        <p className="text-sm text-neutral-500">
          Empty categories are automatically hidden on the storefront.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-bold">Categories & Subcategories</h2>
          <div className="border border-neutral-200 rounded-2xl bg-white divide-y divide-neutral-100">
            {categories.map((c) => (
              <div key={c._id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">
                    {c.parent ? "↳ " : ""}
                    {c.name}
                  </p>
                  <p className="text-xs text-neutral-500">/{c.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteCategory(c._id)}
                  className="p-1.5 text-neutral-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleCreateCategory}
          className="lg:col-span-5 p-6 border border-neutral-200 rounded-2xl bg-neutral-50 space-y-3 h-fit"
        >
          <h3 className="font-bold">Add Category</h3>
          <input
            type="text"
            required
            placeholder="Category Name (e.g. T-Shirts)"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          />
          <select
            value={catParent}
            onChange={(e) => setCatParent(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          >
            <option value="">Top-Level Category</option>
            {categories
              .filter((c) => !c.parent)
              .map((c) => (
                <option key={c._id} value={c._id}>
                  Subcategory of: {c.name}
                </option>
              ))}
          </select>
          <input
            type="text"
            placeholder="Short description"
            value={catDesc}
            onChange={(e) => setCatDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tile Image URL"
              value={catImage}
              onChange={(e) => setCatImage(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <CloudinaryUploadButton
              folder="aura-fashion/categories"
              label="Upload"
              onUploaded={(res) => setCatImage(res.url)}
            />
          </div>
          <input
            type="number"
            min={0}
            placeholder="Sort Order"
            value={catSort}
            onChange={(e) => setCatSort(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-neutral-950 text-white text-sm font-semibold"
          >
            Save Category
          </button>
        </form>
      </div>

      {/* Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-neutral-200">
        <div className="lg:col-span-7 space-y-3">
          <h2 className="font-bold">Brands</h2>
          <div className="border border-neutral-200 rounded-2xl bg-white divide-y divide-neutral-100">
            {brands.map((b) => (
              <div key={b._id} className="p-4 flex items-center justify-between">
                <span className="font-medium text-sm">{b.name}</span>
                <button
                  type="button"
                  onClick={() => void handleDeleteBrand(b._id)}
                  className="p-1.5 text-neutral-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <form
          onSubmit={handleCreateBrand}
          className="lg:col-span-5 p-6 border border-neutral-200 rounded-2xl bg-neutral-50 space-y-3 h-fit"
        >
          <h3 className="font-bold">Add Brand</h3>
          <input
            type="text"
            required
            placeholder="Brand Name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-neutral-950 text-white text-sm font-semibold"
          >
            Save Brand
          </button>
        </form>
      </div>
    </div>
  );
}
