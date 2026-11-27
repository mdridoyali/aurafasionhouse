/**
 * Development-only seed script for AURA Fashion House.
 * Run: npm run seed
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is not set in .env.local");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI!);
  const db = mongoose.connection.db!;

  console.log("Seeding AURA Fashion House development data...");

  // 1. Store Settings (Inside Dhaka 80 TK, Outside Dhaka 160 TK)
  await db.collection("storesettings").updateOne(
    { key: "default" },
    {
      $setOnInsert: {
        key: "default",
        storeName: "AURA Fashion House",
        tagline: "Minimal Everyday Menswear & Essentials",
        insideDhakaCharge: 80,
        outsideDhakaCharge: 160,
        freeDeliveryThreshold: 0,
        bkashMerchantNumber: "01700-000000",
        bkashInstructions:
          "Send Money or Payment to our bKash merchant number, then enter your sender number & TrxID.",
        nagadMerchantNumber: "01800-000000",
        nagadInstructions:
          "Send Money or Payment to our Nagad merchant number, then enter your sender number & TrxID.",
        whatsappNumber: "8801700000000",
        supportPhone: "+880 1700-000000",
        supportEmail: "care@aurafashion.com.bd",
        address: "House 24, Road 11, Banani, Dhaka 1213, Bangladesh",
        promoStripText:
          "Inside Dhaka ৳80 • Outside Dhaka ৳160 • 7-Day Easy Size Exchange • bKash, Nagad & COD",
        lowStockAlertThreshold: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  // 2. Categories
  const categoryDefs = [
    {
      name: "T-Shirts",
      slug: "t-shirts",
      description: "220 GSM combed cotton & relaxed everyday tees",
      image: "/images/tee-obsidian.svg",
      sortOrder: 1,
    },
    {
      name: "Polos",
      slug: "polos",
      description: "Breathable honeycomb pique knit polos",
      image: "/images/polo-forest.svg",
      sortOrder: 2,
    },
    {
      name: "Shirts",
      slug: "shirts",
      description: "Crisp Oxford & casual button-down shirts",
      image: "/images/shirt-oxford.svg",
      sortOrder: 3,
    },
    {
      name: "Pants",
      slug: "pants",
      description: "Tailored stretch chinos & everyday trousers",
      image: "/images/pant-chino.svg",
      sortOrder: 4,
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Minimal caps, belts & everyday essentials",
      image: "/images/cap-minimal.svg",
      sortOrder: 5,
    },
  ];

  const catIdMap = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of categoryDefs) {
    const res = await db.collection("categories").findOneAndUpdate(
      { slug: cat.slug },
      {
        $setOnInsert: {
          ...cat,
          parent: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    if (res) catIdMap.set(cat.slug, res._id as mongoose.Types.ObjectId);
  }

  // 3. Brand
  const brandRes = await db.collection("brands").findOneAndUpdate(
    { slug: "aura-studio" },
    {
      $setOnInsert: {
        name: "AURA Studio",
        slug: "aura-studio",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  const brandId = brandRes?._id as mongoose.Types.ObjectId;

  // 4. Sample Products
  const commonSizeGuide = [
    { size: "M", chest: '40"', length: '27.5"', shoulder: '17.5"' },
    { size: "L", chest: '42"', length: '28.5"', shoulder: '18.5"' },
    { size: "XL", chest: '44"', length: '29.5"', shoulder: '19.5"' },
  ];

  const products = [
    {
      name: "AURA Heavyweight Drop-Shoulder Tee",
      slug: "aura-heavyweight-drop-shoulder-tee",
      shortDescription: "220 GSM 100% combed ring-spun cotton relaxed tee.",
      description:
        "Engineered for the Dhaka climate, our signature 220 GSM drop-shoulder tee holds its crisp boxy silhouette all day while staying breathable and soft on skin.",
      category: catIdMap.get("t-shirts"),
      brand: brandId,
      basePrice: 890,
      compareAtPrice: 1090,
      discountPercent: 18,
      fabric: "100% Combed Ring-Spun Cotton",
      gsm: 220,
      careInstructions: ["Machine wash cold inside out", "Do not tumble dry", "Steam or low iron"],
      sizeGuide: commonSizeGuide,
      images: [
        { url: "/images/tee-obsidian.svg", color: "Obsidian Black", sortOrder: 0 },
        { url: "/images/tee-ivory.svg", color: "Ivory", sortOrder: 1 },
      ],
      variants: [
        {
          sku: "AUR-TEE-BLK-M",
          size: "M",
          color: "Obsidian Black",
          colorHex: "#111111",
          price: 890,
          compareAtPrice: 1090,
          stock: 18,
          lowStockThreshold: 5,
        },
        {
          sku: "AUR-TEE-BLK-L",
          size: "L",
          color: "Obsidian Black",
          colorHex: "#111111",
          price: 890,
          compareAtPrice: 1090,
          stock: 14,
          lowStockThreshold: 5,
        },
        {
          sku: "AUR-TEE-IVR-M",
          size: "M",
          color: "Ivory",
          colorHex: "#F5F5F4",
          price: 890,
          compareAtPrice: 1090,
          stock: 4,
          lowStockThreshold: 5,
        },
      ],
      totalStock: 36,
      tags: ["t-shirt", "oversized", "cotton", "summer"],
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isFlashSale: true,
    },
    {
      name: "AURA Honeycomb Pique Polo",
      slug: "aura-honeycomb-pique-polo",
      shortDescription: "Structured collar breathable pique knit polo shirt.",
      description:
        "Refined smart-casual pique polo crafted from 210 GSM mercerized cotton with double-stitched placket and anti-curl collar.",
      category: catIdMap.get("polos"),
      brand: brandId,
      basePrice: 1290,
      compareAtPrice: 1490,
      discountPercent: 13,
      fabric: "100% Mercerized Pique Cotton",
      gsm: 210,
      careInstructions: ["Gentle machine wash", "Dry flat in shade"],
      sizeGuide: commonSizeGuide,
      images: [
        { url: "/images/polo-forest.svg", color: "Forest Green", sortOrder: 0 },
        { url: "/images/tee-obsidian.svg", color: "Charcoal", sortOrder: 1 },
      ],
      variants: [
        {
          sku: "AUR-PLO-GRN-M",
          size: "M",
          color: "Forest Green",
          colorHex: "#14532D",
          price: 1290,
          compareAtPrice: 1490,
          stock: 12,
          lowStockThreshold: 5,
        },
        {
          sku: "AUR-PLO-GRN-L",
          size: "L",
          color: "Forest Green",
          colorHex: "#14532D",
          price: 1290,
          compareAtPrice: 1490,
          stock: 10,
          lowStockThreshold: 5,
        },
      ],
      totalStock: 22,
      tags: ["polo", "smart-casual"],
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isFlashSale: false,
    },
    {
      name: "AURA Classic Oxford Button-Down Shirt",
      slug: "aura-classic-oxford-button-down",
      shortDescription: "Tailored 100% cotton Oxford shirt for work and weekend.",
      description:
        "Crisp basket-weave Oxford cloth washed for immediate softness. Features a clean chest pocket and reinforced side gussets.",
      category: catIdMap.get("shirts"),
      brand: brandId,
      basePrice: 1690,
      discountPercent: 0,
      fabric: "100% Cotton Oxford Weave",
      gsm: 165,
      careInstructions: ["Machine wash warm", "Medium iron"],
      sizeGuide: commonSizeGuide,
      images: [
        { url: "/images/shirt-oxford.svg", color: "Sky Mist", sortOrder: 0 },
        { url: "/images/tee-ivory.svg", color: "White", sortOrder: 1 },
      ],
      variants: [
        {
          sku: "AUR-SHT-SKY-M",
          size: "M",
          color: "Sky Mist",
          colorHex: "#CBD5E1",
          price: 1690,
          stock: 15,
          lowStockThreshold: 5,
        },
        {
          sku: "AUR-SHT-SKY-L",
          size: "L",
          color: "Sky Mist",
          colorHex: "#CBD5E1",
          price: 1690,
          stock: 15,
          lowStockThreshold: 5,
        },
      ],
      totalStock: 30,
      tags: ["shirt", "oxford", "formal"],
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      isFlashSale: false,
    },
    {
      name: "AURA Tailored Stretch Chino Pant",
      slug: "aura-tailored-stretch-chino",
      shortDescription: "98% cotton 2% elastane tapered everyday chino.",
      description:
        "Designed for effortless movement from desk to dinner with enzyme-washed twill and clean concealed coin pocket.",
      category: catIdMap.get("pants"),
      brand: brandId,
      basePrice: 1850,
      compareAtPrice: 2150,
      discountPercent: 14,
      fabric: "98% Cotton, 2% Elastane Twill",
      gsm: 260,
      careInstructions: ["Wash cold with similar colors", "Do not bleach"],
      sizeGuide: [
        { size: "30", chest: '30"', length: '39"', waist: '30"' },
        { size: "32", chest: '32"', length: '40"', waist: '32"' },
        { size: "34", chest: '34"', length: '40.5"', waist: '34"' },
      ],
      images: [{ url: "/images/pant-chino.svg", color: "Warm Stone", sortOrder: 0 }],
      variants: [
        {
          sku: "AUR-PNT-STN-30",
          size: "30",
          color: "Warm Stone",
          colorHex: "#78716C",
          price: 1850,
          compareAtPrice: 2150,
          stock: 10,
          lowStockThreshold: 5,
        },
        {
          sku: "AUR-PNT-STN-32",
          size: "32",
          color: "Warm Stone",
          colorHex: "#78716C",
          price: 1850,
          compareAtPrice: 2150,
          stock: 14,
          lowStockThreshold: 5,
        },
      ],
      totalStock: 24,
      tags: ["pant", "chino", "trouser"],
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      isFlashSale: true,
    },
    {
      name: "AURA Minimal Brushed Twill Cap",
      slug: "aura-minimal-brushed-twill-cap",
      shortDescription: "6-panel unstructured cotton twill cap with metal clasp.",
      description:
        "Clean unstructured 6-panel silhouette in heavy brushed cotton twill with an adjustable antique brass slider.",
      category: catIdMap.get("accessories"),
      brand: brandId,
      basePrice: 550,
      discountPercent: 0,
      fabric: "100% Brushed Cotton Twill",
      gsm: 280,
      careInstructions: ["Spot clean with damp cloth"],
      sizeGuide: [],
      images: [{ url: "/images/cap-minimal.svg", color: "Matte Black", sortOrder: 0 }],
      variants: [
        {
          sku: "AUR-CAP-BLK-OS",
          size: "One Size",
          color: "Matte Black",
          colorHex: "#171717",
          price: 550,
          stock: 25,
          lowStockThreshold: 5,
        },
      ],
      totalStock: 25,
      tags: ["cap", "accessory"],
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      isFlashSale: false,
    },
  ];

  for (const prod of products) {
    await db.collection("products").updateOne(
      { slug: prod.slug },
      {
        $setOnInsert: {
          ...prod,
          subcategory: null,
          soldCount: 0,
          ratingAvg: 0,
          ratingCount: 0,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  // 5. Hero Banner
  const existingBanners = await db.collection("banners").countDocuments();
  if (existingBanners === 0) {
    await db.collection("banners").insertOne({
      title: "Minimal Essentials. Made for Dhaka.",
      subtitle:
        "220 GSM combed cotton tees, pique polos & tailored chinos. Delivery ৳80 inside Dhaka, ৳160 outside Dhaka.",
      badge: "New Season Drop",
      ctaText: "Shop Collection",
      ctaLink: "/shop",
      imageUrl: "/images/banner-editorial.svg",
      placement: "hero",
      sortOrder: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 6. Sample Coupon
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 45);
  await db.collection("coupons").updateOne(
    { code: "AURA10" },
    {
      $setOnInsert: {
        code: "AURA10",
        description: "10% off on orders of ৳1,000 or more",
        type: "percent",
        value: 10,
        minOrderAmount: 1000,
        maxDiscount: 500,
        expiresAt: nextMonth,
        perUserLimit: 2,
        usedCount: 0,
        usedBy: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log("Seed completed successfully.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
