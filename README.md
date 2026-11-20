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

DailyCart implements security mechanisms designed to protect customer information and platform operations.

- Firebase Authentication for account management.
- Firebase Admin SDK for trusted server-side operations.
- Secure session-cookie authentication for administrators.
- Role-based access control for delivery personnel.
- Protected administrative API routes.
- Server-side order and payment validation.
- Environment-based secret management.

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
