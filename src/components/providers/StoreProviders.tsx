"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import type { ClientCartItem, ClientUser } from "@/types/store";

const GUEST_CART_KEY = "aura_guest_cart_v1";

interface StoreContextValue {
  user: ClientUser | null;
  authLoading: boolean;
  cart: ClientCartItem[];
  cartCount: number;
  cartSubtotal: number;
  wishlistIds: string[];
  refreshAuthAndCart: () => Promise<void>;
  addToCart: (item: ClientCartItem) => Promise<boolean>;
  updateCartQuantity: (sku: string, quantity: number) => Promise<void>;
  removeFromCart: (sku: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  logout: () => Promise<void>;
  toast: (title: string, icon?: "success" | "error" | "info" | "warning") => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readGuestCart(): ClientCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: ClientCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function StoreProviders({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: ClientUser | null;
}) {
  const router = useRouter();
  const [user, setUser] = useState<ClientUser | null>(initialUser);
  const [authLoading, setAuthLoading] = useState(false);
  const [cart, setCart] = useState<ClientCartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const toast = useCallback(
    (title: string, icon: "success" | "error" | "info" | "warning" = "success") => {
      void Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true,
      });
    },
    []
  );

  const loadAuthenticatedState = useCallback(async () => {
    const guestItems = readGuestCart();
    if (guestItems.length > 0) {
      await fetch("/api/cart/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: guestItems.map((i) => ({
            productId: i.productId,
            sku: i.sku,
            quantity: i.quantity,
          })),
        }),
      }).catch(() => {});
      window.localStorage.removeItem(GUEST_CART_KEY);
    }

    const [cartRes, wishRes] = await Promise.all([
      fetch("/api/cart", { cache: "no-store" }),
      fetch("/api/account/wishlist", { cache: "no-store" }),
    ]);

    if (cartRes.ok) {
      const json = await cartRes.json();
      setCart(json.data?.items ?? []);
    }
    if (wishRes.ok) {
      const json = await wishRes.json();
      const list = (json.data?.wishlist ?? []) as Array<{ _id: string }>;
      setWishlistIds(list.map((p) => p._id));
    }
  }, []);

  const refreshAuthAndCart = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const json = await res.json();
      const currentUser = (json.data?.user ?? null) as ClientUser | null;
      setUser(currentUser);
      if (currentUser) {
        await loadAuthenticatedState();
      } else {
        setCart(readGuestCart());
        setWishlistIds([]);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [loadAuthenticatedState]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      if (initialUser) {
        await loadAuthenticatedState();
      } else {
        setCart(readGuestCart());
      }
    });
    return () => {
      active = false;
    };
  }, [initialUser, loadAuthenticatedState]);

  const addToCart = useCallback(
    async (item: ClientCartItem): Promise<boolean> => {
      if (item.stock < 1) {
        toast("This item is currently out of stock.", "error");
        return false;
      }

      if (user) {
        const existing = cart.find((c) => c.sku === item.sku);
        const nextQty = Math.min((existing?.quantity ?? 0) + item.quantity, item.stock);
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            sku: item.sku,
            quantity: nextQty,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast(json.error || "Could not add to cart.", "error");
          return false;
        }
        setCart(json.data.items);
        toast("Added to your bag");
        return true;
      }

      // Guest localStorage cart
      const current = [...cart];
      const idx = current.findIndex((c) => c.sku === item.sku);
      if (idx >= 0) {
        const existing = current[idx]!;
        existing.quantity = Math.min(existing.quantity + item.quantity, item.stock);
      } else {
        current.push({ ...item, quantity: Math.min(item.quantity, item.stock) });
      }
      setCart(current);
      writeGuestCart(current);
      toast("Added to your bag");
      return true;
    },
    [cart, toast, user]
  );

  const updateCartQuantity = useCallback(
    async (sku: string, quantity: number) => {
      const target = cart.find((c) => c.sku === sku);
      if (!target) return;
      const safeQty = Math.max(1, Math.min(quantity, target.stock));

      if (user) {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: target.productId,
            sku,
            quantity: safeQty,
          }),
        });
        const json = await res.json();
        if (res.ok) {
          setCart(json.data.items);
        } else {
          toast(json.error || "Could not update quantity.", "error");
        }
        return;
      }

      const next = cart.map((c) => (c.sku === sku ? { ...c, quantity: safeQty } : c));
      setCart(next);
      writeGuestCart(next);
    },
    [cart, toast, user]
  );

  const removeFromCart = useCallback(
    async (sku: string) => {
      if (user) {
        const res = await fetch(`/api/cart?sku=${encodeURIComponent(sku)}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (res.ok) {
          setCart(json.data.items);
          toast("Removed from bag", "info");
        }
        return;
      }
      const next = cart.filter((c) => c.sku !== sku);
      setCart(next);
      writeGuestCart(next);
      toast("Removed from bag", "info");
    },
    [cart, toast, user]
  );

  const clearCart = useCallback(async () => {
    if (user) {
      await fetch("/api/cart", { method: "DELETE" });
      setCart([]);
      return;
    }
    setCart([]);
    writeGuestCart([]);
  }, [user]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) {
        toast("Please sign in to save items to your wishlist.", "info");
        return;
      }
      const res = await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (res.ok) {
        setWishlistIds(json.data.wishlistIds);
        toast(json.data.saved ? "Saved to wishlist" : "Removed from wishlist", "info");
      }
    },
    [toast, user]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    setCart(readGuestCart());
    setWishlistIds([]);
    toast("Signed out", "info");
    router.push("/");
    router.refresh();
  }, [router, toast]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        user,
        authLoading,
        cart,
        cartCount,
        cartSubtotal,
        wishlistIds,
        refreshAuthAndCart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        logout,
        toast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProviders");
  return ctx;
}
