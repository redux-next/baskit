# 🛒 DailyCart

### Fresh Groceries. Fast Delivery. Easy Living.

DailyCart is a modern grocery delivery platform focused on making everyday shopping convenient, reliable, and accessible. Customers can browse grocery essentials, place orders, and track deliveries, while administrators and delivery personnel manage the complete order fulfillment process.

DailyCart is being developed as a startup product with a focus on seamless shopping experiences, efficient operations, and reliable last-mile delivery.

---

## 🚀 Platform Overview

DailyCart consists of three integrated systems:

- **Customer Application** – A shopping platform where customers browse products, manage carts, place orders, and track deliveries.
- **Admin Dashboard** – A centralized management platform for handling products, orders, and delivery personnel.
- **Delivery Personnel System** – A dedicated interface for managing assigned deliveries, updating order statuses, and sharing live locations.

---

## ✨ Key Features

### 🛍️ Customer Application

- Google and Email/Password authentication.
- Customer profile creation and management.
- Browse grocery products by category.
- Product search and discovery.
- Shopping cart with quantity management.
- Order placement and checkout.
- Cash on Delivery (COD).
- Order history and order details.
- Real-time order status tracking.
- Live delivery location tracking.
- Customer address and location management.

### 🖥️ Admin Dashboard

- Secure administrator authentication.
- Centralized order management.
- Search and filter orders.
- Update order statuses.
- Assign and unassign delivery personnel.
- View delivery personnel details.
- Product management.
- Add, edit, and delete products.
- Product image uploads.
- Manage product prices, categories, and stock.

### 🚴 Delivery Personnel System

- Dedicated delivery personnel authentication.
- Role-based access control.
- View assigned orders.
- Access customer delivery details.
- Update delivery progress.
- Live GPS location sharing.
- Cash on Delivery collection management.
- Automatic removal of completed deliveries from active orders.

---

## 🛠️ Technology Stack

| Technology | Usage |
|---|---|
| Next.js | Application framework |
| React.js | User interface |
| JavaScript | Application logic |
| Tailwind CSS | Styling |
| Firebase Authentication | Authentication |
| Cloud Firestore | Database |
| Firebase Admin SDK | Server-side operations |
| Firebase Storage | File storage integration |
| Cloudinary | Product image management |
| Leaflet | Maps and location tracking |
| Lucide React | Icons |

---

## 🏗️ Application Architecture

DailyCart uses a separate customer application and admin dashboard connected to a shared Firebase backend.

```text
                 DailyCart PLATFORM
                         |
             +-----------+-----------+
             |                       |
      Customer App              Admin Dashboard
             |                       |
             +-----------+-----------+
                         |
                  Firebase Backend
                         |
          +--------------+--------------+
          |              |              |
       Firebase       Firestore      Firebase
       Auth           Database       Admin SDK
          |
   Delivery Personnel
       Interface
          |
     Live GPS Tracking
```

---

## 📂 Project Structure

```text
QuickBite/
│
├── QuickBite/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   └── public/
│
└── QuickBite-admin/
    ├── app/
    ├── components/
    ├── lib/
    └── public/
```

The delivery personnel interface is integrated into the customer application with role-based access.

---

## ⚙️ Development Setup

### Prerequisites

- Node.js (LTS)
- npm
- Firebase project access
- Cloudinary account

### Customer Application

```bash
git clone https://github.com/redux-next/baskit.git

cd QuickBite

npm install

npm run dev
```

### Admin Dashboard

```bash
git clone https://github.com/redux-next/QuickBite-admin.git

cd QuickBite-admin

npm install

npm run dev
```

### Environment Configuration

Create a `.env.local` file in each application's root directory and configure the required credentials.

Example Firebase client configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Additional server-side configuration may include:

- Firebase Admin service account credentials.
- Approved administrator email addresses.
- Cloudinary credentials.
- Other application-specific secrets.

**Security:** Never commit `.env.local`, Firebase service account JSON files, private keys, or other sensitive credentials to version control.

---

## 🔐 Security & Access Control

The customer application deploys `firestore.rules` and `storage.rules` through the Firebase CLI. Firestore authorization uses Firebase Authentication UID ownership and server-issued custom claims; a profile field such as `role` is never an authorization source.

| Collection | Customer | Delivery partner | Admin (`admin: true`) |
|---|---|---|---|
| `products`, `categories` | Public read | Public read | Read and write |
| `users/{uid}` | Read and edit own profile fields only | No customer-profile access | Read and write |
| `carts/{uid}` | Read and edit own cart only | No access | Read and write |
| `orders/{id}` | Read orders with matching `userId` | Read orders assigned by `deliveryBoyId` | Read and write |
| `deliveryLocations/{orderId}` | Read only when the linked order belongs to them | Read only when assigned to the linked order | Read and write |
| `deliveryPersonnel/{uid}` | No access | No access | Read and write |
| `settings/connection-check` | Read only that probe document | Read only that probe document | Read and write |

Client writes to orders and delivery locations are denied. Order creation, stock deduction, assignment/status/payment changes, and delivery GPS writes must go through authenticated server APIs using Firebase Admin. Those APIs bypass Firestore rules and must enforce their own authorization; the customer app's delivery endpoints check the `deliveryBoy: true` claim and assignment, and the admin test endpoint checks `admin: true`. The final Firestore match denies any unspecified collection or operation.

Order placement requires a client-generated idempotency key, retained in the tab's session storage for retries of the same cart and payment method. The server scopes the key to the authenticated customer and stores a hash of the normalized checkout payload. The order, key record, stock deductions, and cart deletion commit in one Firestore transaction. A matching retry returns the original order; reusing the key with a different payload is rejected. Prices and fees continue to come from server-read product and checkout policy data.

The customer profile rule permits only the profile fields currently written by the profile form (`uid`, name/contact/address/location, profile completion, and timestamps); it does not permit role or privilege fields. The cart rule permits only `items` and `updatedAt`. Account deletion remains server-side. The `admin` and `deliveryBoy` claims must be granted or revoked through trusted Firebase Admin operations, never by client writes.

The application currently has no Firebase Storage object reads or writes. Storage rules therefore deny all access. If a Firebase Storage upload feature is added, define its object paths, ownership, size, and content-type requirements before relaxing this rule.

### Rules tests and deployment

Install dependencies and run the Firestore and Storage emulator tests with a Java runtime available:

```bash
npm install
npm run test:firebase-rules
npm run test:order-idempotency
```

The test command uses the isolated `demo-dailycart-rules` emulator project and does not access production. It was validated with Java 21. This repository does not select a default Firebase project because the production project ID is environment-specific.

After reviewing the rules and tests, deploy explicitly to the intended project:

```bash
npx firebase-tools deploy --only firestore:rules,storage --project YOUR_FIREBASE_PROJECT_ID
```

No rules are deployed automatically. Confirm the selected project ID before running the deploy command.

Before deploying, confirm that existing production orders use the `userId` and `deliveryBoyId` fields used by this application, that every intended administrator has the server-issued `admin: true` claim, and that no separate admin application depends on Firebase Storage. The separate admin dashboard is not part of this repository; although the customer app has no Firebase Storage object calls, the platform overview describes image uploads. The checked-in Storage rule intentionally denies those operations until their path and authorization model are reviewed.

---

## 📌 Development Roadmap

DailyCart is an actively developed startup platform. Future development will focus on improving the customer experience, delivery operations, and platform capabilities.

Potential areas of development include:

- UPI and online payment integration.
- Push notifications.
- Promotional offers and discount management.
- Customer ratings and reviews.
- Advanced analytics and business reporting.
- Delivery route optimization.

---

## 👨‍💻 Development Team

DailyCart is developed and maintained by:

| Name | Role |
|---|---|
| **Gyanam Gogoi** | Full-Stack Developer |
| **Oisik Gogoi** | Full-Stack Developer |

Both contributors are involved in the development of the DailyCart platform.

---

## 🔒 Proprietary & Confidential

© 2026 DailyCart. All rights reserved.

DailyCart is a privately developed startup project. The source code, application architecture, designs, branding, business logic, and associated materials are proprietary.

This repository is intended exclusively for authorized contributors and development purposes.

Unauthorized copying, redistribution, modification, publication, or commercial use of any part of this project without prior written permission is prohibited.

---

<p align="center">
  <b>DailyCart</b><br/>
  Fresh Groceries. Fast Delivery. Easy Living.
</p>
