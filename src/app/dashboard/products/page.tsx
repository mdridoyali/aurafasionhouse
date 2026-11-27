"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { ArrowUp, ArrowDown, Plus, Trash2, Edit3 } from "lucide-react";
import { formatBDT } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";
import { CloudinaryUploadButton } from "@/components/dashboard/CloudinaryUploadButton";

interface VariantInput {
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
}

interface ImageInput {
  url: string;
  publicId?: string;
  color?: string;
  sortOrder: number;
}

interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: { _id: string; name: string } | string;
  subcategory?: { _id: string; name: string } | string | null;
  brand?: { _id: string; name: string } | string | null;
  basePrice: number;
  compareAtPrice?: number;
  fabric: string;
  gsm?: number;
  careInstructions: string[];
  images: ImageInput[];
  variants: VariantInput[];
  totalStock: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFlashSale: boolean;
  isActive: boolean;
}

interface OptionItem {
  _id: string;
  name: string;
  parent?: string | null;
}

const EMPTY_VARIANT: VariantInput = {
  sku: "",
  size: "M",
  color: "Black",
  colorHex: "#111111",
  price: 990,
  stock: 20,
  lowStockThreshold: 5,
};

export default function DashboardProductsPage() {
  const { toast } = useStore();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [basePrice, setBasePrice] = useState(990);
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [fabric, setFabric] = useState("100% Combed Ring-Spun Cotton");
  const [gsm, setGsm] = useState<number | "">(180);
  const [careText, setCareText] = useState("Machine wash cold\nDo not bleach\nIron low heat");
  const [images, setImages] = useState<ImageInput[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [variants, setVariants] = useState<VariantInput[]>([{ ...EMPTY_VARIANT }]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    const [pRes, cRes, bRes] = await Promise.all([
      fetch("/api/products?includeInactive=true&limit=48", { cache: "no-store" }),
      fetch("/api/categories?includeInactive=true", { cache: "no-store" }),
      fetch("/api/brands", { cache: "no-store" }),
    ]);
    const [pJson, cJson, bJson] = await Promise.all([pRes.json(), cRes.json(), bRes.json()]);
    if (pJson.ok) setProducts(pJson.data.products);
    if (cJson.ok) {
      setCategories(cJson.data.categories);
      if (!category && cJson.data.categories.length > 0) {
        const root = cJson.data.categories.find((c: OptionItem) => !c.parent);
        if (root) setCategory(root._id);
      }
    }
    if (bJson.ok) setBrands(bJson.data.brands);
  }, [category]);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setShortDescription("");
    setDescription("");
    setSubcategory("");
    setBrand("");
    setBasePrice(990);
    setCompareAtPrice("");
    setFabric("100% Combed Ring-Spun Cotton");
    setGsm(180);
    setCareText("Machine wash cold\nDo not bleach\nIron low heat");
    setImages([]);
    setVariants([{ ...EMPTY_VARIANT }]);
    setIsFeatured(false);
    setIsNewArrival(true);
    setIsBestSeller(false);
    setIsFlashSale(false);
    setIsActive(true);
  };

  const startEdit = (p: ProductItem) => {
    setEditingId(p._id);
    setName(p.name);
    setShortDescription(p.shortDescription);
    setDescription(p.description);
    setCategory(typeof p.category === "string" ? p.category : p.category?._id || "");
    setSubcategory(
      p.subcategory ? (typeof p.subcategory === "string" ? p.subcategory : p.subcategory._id) : ""
    );
    setBrand(p.brand ? (typeof p.brand === "string" ? p.brand : p.brand._id) : "");
    setBasePrice(p.basePrice);
    setCompareAtPrice(p.compareAtPrice ?? "");
    setFabric(p.fabric);
    setGsm(p.gsm ?? "");
    setCareText(p.careInstructions.join("\n"));
    setImages(p.images);
    setVariants(p.variants);
    setIsFeatured(p.isFeatured);
    setIsNewArrival(p.isNewArrival);
    setIsBestSeller(p.isBestSeller);
    setIsFlashSale(p.isFlashSale);
    setIsActive(p.isActive);
    setShowForm(true);
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setImages(next.map((img, i) => ({ ...img, sortOrder: i })));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        shortDescription,
        description,
        category,
        subcategory: subcategory || null,
        brand: brand || null,
        basePrice: Number(basePrice),
        compareAtPrice: compareAtPrice === "" ? undefined : Number(compareAtPrice),
        fabric,
        gsm: gsm === "" ? undefined : Number(gsm),
        careInstructions: careText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        images: images.map((img, i) => ({ ...img, sortOrder: i })),
        variants,
        isFeatured,
        isNewArrival,
        isBestSeller,
        isFlashSale,
        isActive,
      };

      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Could not save product.", "error");
        return;
      }

      toast(editingId ? "Product updated!" : "Product created!");
      resetForm();
      setShowForm(false);
      void loadAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Delete this product?",
      text: "Products present in past orders will be safely archived (soft-deleted).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Product removed", "info");
      void loadAll();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-neutral-500">
            Manage garments, Cloudinary images, and size/color variant SKUs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-neutral-950 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Close Form" : "New Product"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="p-6 border border-neutral-200 rounded-2xl bg-neutral-50 space-y-6"
        >
          <h2 className="font-bold text-lg">{editingId ? "Edit Product" : "Create Product"}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              >
                <option value="">Select Category</option>
                {categories
                  .filter((c) => !c.parent)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Subcategory (Optional)</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              >
                <option value="">None</option>
                {categories
                  .filter((c) => c.parent === category)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Brand (Optional)</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              >
                <option value="">AURA House</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Base Price (৳)</label>
              <input
                type="number"
                required
                min={1}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Compare-At Price (৳)</label>
              <input
                type="number"
                min={0}
                value={compareAtPrice}
                onChange={(e) =>
                  setCompareAtPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Fabric</label>
              <input
                type="text"
                required
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">GSM</label>
              <input
                type="number"
                value={gsm}
                onChange={(e) => setGsm(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Short Description</label>
              <input
                type="text"
                required
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Care Instructions (1 per line)</label>
              <textarea
                rows={2}
                value={careText}
                onChange={(e) => setCareText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Full Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
          </div>

          {/* Images Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider">
                Product Images ({images.length})
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <CloudinaryUploadButton
                  folder="aura-fashion/products"
                  onUploaded={(res) =>
                    setImages((prev) => [
                      ...prev,
                      { url: res.url, publicId: res.publicId, sortOrder: prev.length },
                    ])
                  }
                />
                <input
                  type="text"
                  placeholder="Or paste image URL..."
                  value={manualImageUrl}
                  onChange={(e) => setManualImageUrl(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs w-48"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!manualImageUrl.trim()) return;
                    setImages((prev) => [
                      ...prev,
                      { url: manualImageUrl.trim(), sortOrder: prev.length },
                    ]);
                    setManualImageUrl("");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 text-white text-xs"
                >
                  Add URL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="p-2 border border-neutral-200 rounded-xl bg-white space-y-1.5">
                  <div className="relative aspect-[3/4] rounded overflow-hidden bg-neutral-100">
                    <Image src={img.url} alt="Product" fill className="object-cover" />
                  </div>
                  <input
                    type="text"
                    placeholder="Color tag"
                    value={img.color || ""}
                    onChange={(e) => {
                      const next = [...images];
                      next[idx] = { ...img, color: e.target.value };
                      setImages(next);
                    }}
                    className="w-full px-2 py-1 rounded border border-neutral-200 text-[11px]"
                  />
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => moveImage(idx, -1)} className="p-1">
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => moveImage(idx, 1)} className="p-1">
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="p-1 text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variants Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider">
                Size & Color Variants ({variants.length})
              </label>
              <button
                type="button"
                onClick={() => setVariants([...variants, { ...EMPTY_VARIANT, price: basePrice }])}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium"
              >
                + Add Variant
              </button>
            </div>
            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-2 sm:grid-cols-7 gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl items-center"
                >
                  <input
                    type="text"
                    required
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, sku: e.target.value.toUpperCase() };
                      setVariants(next);
                    }}
                    className="px-2 py-1.5 rounded border border-neutral-300 text-xs uppercase"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Size (M, L)"
                    value={v.size}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, size: e.target.value };
                      setVariants(next);
                    }}
                    className="px-2 py-1.5 rounded border border-neutral-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Color"
                    value={v.color}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, color: e.target.value };
                      setVariants(next);
                    }}
                    className="px-2 py-1.5 rounded border border-neutral-300 text-xs"
                  />
                  <input
                    type="color"
                    value={v.colorHex}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, colorHex: e.target.value };
                      setVariants(next);
                    }}
                    className="h-8 w-full rounded border border-neutral-300"
                  />
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Price"
                    value={v.price}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, price: Number(e.target.value) };
                      setVariants(next);
                    }}
                    className="px-2 py-1.5 rounded border border-neutral-300 text-xs"
                  />
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Stock"
                    value={v.stock}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, stock: Number(e.target.value) };
                      setVariants(next);
                    }}
                    className="px-2 py-1.5 rounded border border-neutral-300 text-xs"
                  />
                  <button
                    type="button"
                    disabled={variants.length === 1}
                    onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                    className="p-1.5 text-red-600 disabled:opacity-30 justify-self-end"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-5 text-xs font-medium">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active (Visible)
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} />
              New Arrival
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} />
              Best Seller
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isFlashSale} onChange={(e) => setIsFlashSale(e.target.checked)} />
              Flash Sale
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#c2410c] hover:bg-[#9a3412] text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
          </button>
        </form>
      )}

      {/* Product List */}
      <div className="border border-neutral-200 rounded-2xl bg-white overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-neutral-200 text-xs text-neutral-500 bg-neutral-50">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Variants</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b border-neutral-100">
                <td className="py-3 px-4 font-semibold">{p.name}</td>
                <td className="py-3 px-4">{formatBDT(p.basePrice)}</td>
                <td className="py-3 px-4">{p.variants.length} SKUs</td>
                <td className="py-3 px-4 font-medium">{p.totalStock}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-300 text-xs hover:bg-neutral-50"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(p._id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
