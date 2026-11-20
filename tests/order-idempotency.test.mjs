import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { createOrder } from "../src/lib/order-creation.mjs";

const projectId = "demo-dailycart-rules";
const customerId = "customer-1";
const idempotencyKey = "attempt-key-0001";
let app;
let db;

const profile = {
  uid: customerId,
  name: "Customer One",
  email: "customer@example.test",
  phoneNumber: "9876543210",
  address: "1 Market Road",
  pincode: "786001",
  location: { latitude: 27.48253, longitude: 95.17451 },
  profileCompleted: true,
};

async function clearDatabase() {
  const collections = await db.listCollections();
  await Promise.all(
    collections.map((collection) => db.recursiveDelete(collection))
  );
}

async function seedData({ stock = 5, products = [1] } = {}) {
  await db.collection("users").doc(customerId).set(profile);

  await Promise.all(
    products.map((id) =>
      db.collection("products").doc(`product-${id}`).set({
        id,
        name: `Product ${id}`,
        category: "Groceries",
        detail: "Unit test product",
        price: 120,
        stock: id === 1 ? stock : 5,
      })
    )
  );
}

function submit(key = idempotencyKey, cart = { "1": 1 }) {
  return createOrder({
    db,
    uid: customerId,
    email: profile.email,
    cart,
    paymentMethod: "cod",
    idempotencyKey: key,
  });
}

async function getStock(productId = 1) {
  const snapshot = await db
    .collection("products")
    .doc(`product-${productId}`)
    .get();
  return snapshot.get("stock");
}

async function getOrderCount() {
  const snapshot = await db.collection("orders").get();
  return snapshot.size;
}

before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("Run these tests with the Firestore emulator.");
  }

  app = initializeApp(
    { projectId },
    `dailycart-order-tests-${process.pid}`
  );
  db = getFirestore(app);
});

beforeEach(clearDatabase);

after(async () => {
  if (app) await deleteApp(app);
});

test("repeated checkout submissions return the original order and deduct stock once", async () => {
  await seedData({ stock: 2 });

  const firstResult = await submit();
  const retryResult = await submit();
  const orderSnapshot = await db
    .collection("orders")
    .doc(firstResult.orderId)
    .get();

  assert.equal(firstResult.replayed, false);
  assert.equal(retryResult.replayed, true);
  assert.equal(retryResult.orderId, firstResult.orderId);
  assert.equal(await getOrderCount(), 1);
  assert.equal(await getStock(), 1);
  assert.equal(orderSnapshot.get("userId"), customerId);
  assert.equal(orderSnapshot.get("pricing.subtotal"), 120);
  assert.equal(orderSnapshot.get("pricing.deliveryFee"), 19);
  assert.equal(orderSnapshot.get("pricing.handlingFee"), 4);
  assert.equal(orderSnapshot.get("pricing.total"), 143);
  assert.equal(orderSnapshot.get("payment.method"), "cod");
  assert.equal(orderSnapshot.get("orderStatus"), "placed");
});

test("simultaneous requests with the same key create one order", async () => {
  await seedData({ stock: 1 });

  const [firstResult, secondResult] = await Promise.all([
    submit(),
    submit(),
  ]);

  assert.equal(firstResult.orderId, secondResult.orderId);
  assert.notEqual(firstResult.replayed, secondResult.replayed);
  assert.equal(await getOrderCount(), 1);
  assert.equal(await getStock(), 0);
});

test("an aborted order transaction leaves no key reservation or stock change", async () => {
  await seedData({ stock: 0 });

  await assert.rejects(submit(), { message: "INSUFFICIENT_STOCK" });
  assert.equal(await getOrderCount(), 0);
  assert.equal(await getStock(), 0);
  assert.equal(
    (
      await db
        .collection("users")
        .doc(customerId)
        .collection("checkoutAttempts")
        .doc(idempotencyKey)
        .get()
    ).exists,
    false
  );

  await db.collection("products").doc("product-1").update({ stock: 1 });
  const retryResult = await submit();

  assert.equal(retryResult.replayed, false);
  assert.equal(await getOrderCount(), 1);
  assert.equal(await getStock(), 0);
});

test("the same key cannot be reused with a different cart", async () => {
  await seedData({ products: [1, 2] });

  const firstResult = await submit();

  await assert.rejects(
    submit(idempotencyKey, { "2": 1 }),
    { message: "IDEMPOTENCY_KEY_REUSED" }
  );

  assert.equal(await getOrderCount(), 1);
  assert.equal(await getStock(1), 4);
  assert.equal(await getStock(2), 5);
  assert.ok(firstResult.orderId);
});
