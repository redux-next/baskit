
const { initializeApp, cert } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

const serviceAccount = require("../.secrets/firebase-service-account.json");

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Preset products
const products = [
  {
    id: 1,
    name: "Farm fresh bananas",
    detail: "Robusta · 6 pieces",
    category: "Fruits & veg",
    price: 42,
    originalPrice: 55,
    badge: "Farm fresh",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 2,
    name: "Creamy avocado",
    detail: "Imported · 1 piece",
    category: "Fruits & veg",
    price: 89,
    originalPrice: 110,
    badge: "Popular",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 3,
    name: "Red, ripe tomatoes",
    detail: "Local · 500 g",
    category: "Fruits & veg",
    price: 36,
    originalPrice: 45,
    badge: "Farm fresh",
    image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 4,
    name: "Sweet strawberries",
    detail: "Mahabaleshwar · 200 g",
    category: "Fruits & veg",
    price: 79,
    originalPrice: 99,
    badge: "20% off",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 5,
    name: "Organic whole milk",
    detail: "Farm made · 1 litre",
    category: "Dairy & eggs",
    price: 68,
    originalPrice: 72,
    badge: "Organic",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 6,
    name: "Free-range eggs",
    detail: "Brown eggs · 6 pieces",
    category: "Dairy & eggs",
    price: 84,
    originalPrice: 96,
    badge: "Free range",
    image: "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 7,
    name: "Salted white butter",
    detail: "Amul · 100 g",
    category: "Dairy & eggs",
    price: 58,
    originalPrice: 60,
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 8,
    name: "Sourdough loaf",
    detail: "Baked today · 400 g",
    category: "Bakery",
    price: 125,
    originalPrice: 150,
    badge: "Baked today",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 9,
    name: "Multigrain sandwich bread",
    detail: "The Baker's Dozen · 350 g",
    category: "Bakery",
    price: 72,
    originalPrice: 80,
    badge: "No preservatives",
    image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 10,
    name: "Stoneground wheat atta",
    detail: "Whole wheat · 1 kg",
    category: "Pantry",
    price: 64,
    originalPrice: 74,
    badge: "Everyday pick",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 11,
    name: "Sea salt potato chips",
    detail: "Lightly salted · 100 g",
    category: "Snacks",
    price: 35,
    originalPrice: 40,
    badge: "Crunch time",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 12,
    name: "Fresh orange juice",
    detail: "Cold pressed · 250 ml",
    category: "Drinks",
    price: 79,
    originalPrice: 95,
    badge: "No added sugar",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=700&q=85",
  },
];

// Preset categories
const categories = [
  {
    id: "fruits-veg",
    name: "Fruits & veg",
    emoji: "🥑",
    sortOrder: 1,
  },
  {
    id: "dairy-eggs",
    name: "Dairy & eggs",
    emoji: "🥛",
    sortOrder: 2,
  },
  {
    id: "bakery",
    name: "Bakery",
    emoji: "🥐",
    sortOrder: 3,
  },
  {
    id: "pantry",
    name: "Pantry",
    emoji: "🌾",
    sortOrder: 4,
  },
  {
    id: "snacks",
    name: "Snacks",
    emoji: "🍿",
    sortOrder: 5,
  },
  {
    id: "drinks",
    name: "Drinks",
    emoji: "🧃",
    sortOrder: 6,
  },
];

async function seedFirestore() {
  const batch = db.batch();

  // Upload products
  for (const product of products) {
    const productRef = db
      .collection("products")
      .doc(`product-${product.id}`);

    batch.set(
      productRef,
      {
        ...product,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Upload categories
  for (const category of categories) {
    const { id, ...categoryData } = category;

    const categoryRef = db
      .collection("categories")
      .doc(id);

    batch.set(
      categoryRef,
      {
        ...categoryData,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();

  console.log("\n================================");
  console.log("DailyCart FIRESTORE SEED SUCCESS");
  console.log("================================");
  console.log(`Products uploaded: ${products.length}`);
  console.log(`Categories uploaded: ${categories.length}`);
  console.log(`Firebase project: ${serviceAccount.project_id}`);
  console.log("================================\n");
}

seedFirestore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nFirestore seed failed:");
    console.error(error);
    process.exit(1);
  });
