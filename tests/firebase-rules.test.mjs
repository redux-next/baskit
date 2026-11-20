import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";

const projectId = "demo-dailycart-rules";
let testEnv;

const profile = {
  uid: "customer-1",
  name: "Customer One",
  email: "customer@example.test",
  phoneNumber: "9876543210",
  address: "1 Market Road",
  pincode: "786001",
  profileCompleted: true,
};

const activeOrder = {
  orderId: "order-1",
  userId: "customer-1",
  deliveryBoyId: "delivery-1",
  orderStatus: "out_for_delivery",
  items: [],
  pricing: { subtotal: 100, deliveryFee: 19, handlingFee: 4, total: 123 },
  payment: { method: "cod", status: "pending" },
};

before(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
    readFile(new URL("../storage.rules", import.meta.url), "utf8"),
  ]);

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "users", "customer-1"), profile),
      setDoc(doc(db, "users", "customer-2"), {
        ...profile,
        uid: "customer-2",
      }),
      setDoc(doc(db, "carts", "customer-1"), {
        items: { "1": 2 },
        updatedAt: new Date(),
      }),
      setDoc(doc(db, "carts", "customer-2"), {
        items: { "2": 1 },
        updatedAt: new Date(),
      }),
      setDoc(doc(db, "products", "product-1"), {
        id: 1,
        name: "Bananas",
        price: 42,
        stock: 10,
      }),
      setDoc(doc(db, "categories", "fruits"), {
        id: "fruits",
        name: "Fruits",
        sortOrder: 1,
      }),
      setDoc(doc(db, "orders", "order-1"), activeOrder),
      setDoc(doc(db, "orders", "order-2"), {
        ...activeOrder,
        orderId: "order-2",
        userId: "customer-2",
        deliveryBoyId: "delivery-2",
      }),
      setDoc(doc(db, "deliveryLocations", "order-1"), {
        orderId: "order-1",
        deliveryBoyId: "delivery-1",
        latitude: 27.48,
        longitude: 95.17,
        isActive: true,
      }),
      setDoc(doc(db, "deliveryLocations", "order-2"), {
        orderId: "order-2",
        deliveryBoyId: "delivery-2",
        latitude: 27.49,
        longitude: 95.18,
        isActive: true,
      }),
      setDoc(doc(db, "deliveryPersonnel", "delivery-1"), {
        uid: "delivery-1",
        name: "Delivery One",
        status: "active",
      }),
      setDoc(doc(db, "settings", "connection-check"), { ok: true }),
    ]);
  });
});

after(async () => {
  await testEnv?.cleanup();
});

test("public catalog and connection check are readable without authentication", async () => {
  const context = testEnv.unauthenticatedContext();
  const db = context.firestore();

  await assertSucceeds(getDocs(collection(db, "products")));
  await assertSucceeds(getDocs(collection(db, "categories")));
  await assertSucceeds(getDoc(doc(db, "settings", "connection-check")));
  await assertFails(getDocs(collection(db, "users")));
});

test("customers can access only their profile and cart", async () => {
  const db = testEnv.authenticatedContext("customer-1").firestore();
  const ownProfile = doc(db, "users", "customer-1");
  const ownCart = doc(db, "carts", "customer-1");

  await assertSucceeds(getDoc(ownProfile));
  await assertSucceeds(updateDoc(ownProfile, { name: "Updated Name" }));
  await assertFails(updateDoc(ownProfile, { role: "admin" }));
  await assertFails(updateDoc(ownProfile, { createdAt: new Date() }));

  const newCustomerDb = testEnv
    .authenticatedContext("customer-new")
    .firestore();
  await assertSucceeds(
    setDoc(doc(newCustomerDb, "users", "customer-new"), {
      uid: "customer-new",
      name: "New Customer",
      email: "new@example.test",
      phoneNumber: "9876543210",
      address: "2 Market Road",
      pincode: "786001",
      location: null,
      profileCompleted: true,
    })
  );
  await assertFails(
    setDoc(doc(db, "users", "customer-forged"), {
      uid: "customer-forged",
      role: "admin",
    })
  );
  await assertFails(getDoc(doc(db, "users", "customer-2")));
  await assertFails(getDoc(doc(db, "carts", "customer-2")));
  await assertSucceeds(getDoc(ownCart));
  await assertSucceeds(
    setDoc(ownCart, { items: { "1": 3 }, updatedAt: new Date() })
  );
  await assertFails(
    setDoc(ownCart, {
      items: { "1": 3 },
      updatedAt: new Date(),
      role: "admin",
    })
  );
});

test("customers can read only their own orders and cannot change order data", async () => {
  const db = testEnv.authenticatedContext("customer-1").firestore();
  const ownOrder = doc(db, "orders", "order-1");

  await assertSucceeds(getDoc(ownOrder));
  await assertSucceeds(
    getDocs(query(collection(db, "orders"), where("userId", "==", "customer-1")))
  );
  await assertFails(getDoc(doc(db, "orders", "order-2")));
  await assertFails(getDocs(collection(db, "orders")));
  await assertFails(updateDoc(ownOrder, { "pricing.total": 1 }));
  await assertFails(updateDoc(ownOrder, { orderStatus: "delivered" }));
  await assertFails(updateDoc(ownOrder, { deliveryBoyId: "customer-1" }));
});

test("delivery partners can read assigned orders and locations, but not write them directly", async () => {
  const db = testEnv
    .authenticatedContext("delivery-1", { deliveryBoy: true })
    .firestore();
  const assignedOrder = doc(db, "orders", "order-1");

  await assertSucceeds(getDoc(assignedOrder));
  await assertSucceeds(
    getDocs(
      query(
        collection(db, "orders"),
        where("deliveryBoyId", "==", "delivery-1")
      )
    )
  );
  await assertFails(getDoc(doc(db, "orders", "order-2")));
  await assertSucceeds(getDoc(doc(db, "deliveryLocations", "order-1")));
  await assertFails(getDoc(doc(db, "deliveryLocations", "order-2")));
  await assertFails(updateDoc(assignedOrder, { orderStatus: "delivered" }));
});

test("admins with the verified admin claim can access operational collections", async () => {
  const db = testEnv
    .authenticatedContext("admin-1", { admin: true })
    .firestore();

  await assertSucceeds(getDocs(collection(db, "users")));
  await assertSucceeds(getDocs(collection(db, "orders")));
  await assertSucceeds(getDoc(doc(db, "deliveryPersonnel", "delivery-1")));
  await assertSucceeds(
    updateDoc(doc(db, "orders", "order-1"), { orderStatus: "confirmed" })
  );
  await assertSucceeds(
    setDoc(doc(db, "products", "product-2"), {
      id: 2,
      name: "Avocado",
      price: 89,
      stock: 5,
    })
  );
});

test("staff permissions require their matching server-issued claim", async () => {
  const noAdminClaim = testEnv.authenticatedContext("admin-1").firestore();
  const noDeliveryClaim = testEnv
    .authenticatedContext("delivery-1")
    .firestore();

  await assertFails(getDocs(collection(noAdminClaim, "users")));
  await assertFails(
    getDoc(doc(noAdminClaim, "deliveryPersonnel", "delivery-1"))
  );
  await assertFails(getDoc(doc(noDeliveryClaim, "orders", "order-1")));
  await assertFails(
    getDoc(doc(noDeliveryClaim, "deliveryLocations", "order-1"))
  );
});

test("unauthenticated users cannot read customer, order, cart, or GPS data", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(db, "users", "customer-1")));
  await assertFails(getDoc(doc(db, "carts", "customer-1")));
  await assertFails(getDoc(doc(db, "orders", "order-1")));
  await assertFails(getDoc(doc(db, "deliveryLocations", "order-1")));
});

test("Storage access is denied for every role until an upload feature is defined", async () => {
  const contexts = [
    testEnv.unauthenticatedContext(),
    testEnv.authenticatedContext("customer-1"),
    testEnv.authenticatedContext("admin-1", { admin: true }),
    testEnv.authenticatedContext("delivery-1", { deliveryBoy: true }),
  ];

  for (const context of contexts) {
    const storage = context.storage(`gs://${projectId}.appspot.com`);
    const objectRef = ref(storage, "private/test.txt");

    await assertFails(uploadString(objectRef, "test"));
    await assertFails(getDownloadURL(objectRef));
  }
});
