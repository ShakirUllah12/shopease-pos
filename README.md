# ShopEase POS — Retail Billing and Shop Management System

**ShopEase POS** is a modern, responsive, production-oriented retail Point of Sale (POS) and inventory management web application tailored for shops managing **Clothing** (apparel with multi-size and multi-color variants) and **General Store** items (everyday packaged goods and single-variant consumables).

Built on the **MERN** stack (Node.js, Express, MongoDB/Mongoose, React, Tailwind CSS, Vite) with native **Pakistani Rupee (PKR / Rs.)** currency formatting and **Asia/Karachi** business timezone representation.

---

## 🌟 Key Features & Functional Modules

### 1. Point of Sale (POS) Billing
- **Real-Time Catalog Search**: Instant search by product name, SKU, or barcode scan with low latency.
- **Clothing Variant Picker**: Fast modal picker for apparel to select size (S, M, L, XL, etc.) and color before adding to cart.
- **General Store 1-Click Addition**: Default single-variant items add directly to the cart with one click.
- **Cart Management**: Real-time quantity stepper, per-item line discount, overall order discount, and grand total.
- **Stock Guard**: Validates in-stock availability before finalizing a sale; prevents negative inventory unless explicitly enabled.
- **Tender & Change Calculator**: Displays amount tendered, net payable, and exact change returned to customer.
- **Split & Digital Payments**: Supports split payments across multiple methods (Cash, Card, JazzCash, EasyPaisa, Bank Transfer, Other).
- **Sequential Receipt Numbers**: Generates format `SE-YYYYMMDD-XXXX` (e.g., `SE-20261013-0001`) with unique database indexing.
- **Historical Snapshots**: Preserves product names, SKUs, colors, sizes, and purchase cost prices in each sale line item, ensuring historical financial accuracy even if catalog items are later modified or deleted.

### 2. Thermal Receipt Printing (58 mm & 80 mm)
- **High-Contrast Monochrome Layout**: Clean monospace layout designed specifically for standard 58 mm (compact rolls) and 80 mm (standard retail rolls) USB thermal printers.
- **Complete Receipt Metadata**: Shop name, address, phone, receipt number, cashier name, customer name, date/time in Asia/Karachi, itemized table with sizes/colors, unit prices, line totals, discounts, taxes, net total, tender breakdown, change returned, and custom return/exchange footer.
- **Browser-Based Printing**: One-click printing via browser system print dialog targeting `@media print` print styles.
- **Preview & Fallback**: Live print preview modal with 58 mm / 80 mm width toggles and an instant **"Copy Plain Text"** clipboard button for backup sharing (e.g. WhatsApp / SMS).
- **Silent USB / ESC/POS Documentation**: Detailed guide included below explaining hardware bridging for direct raw USB printing.

### 3. Product & Variant Catalog
- **Category Support**: Pre-seeded with **Clothing** and **General Store** system categories.
- **Variant Engine**: Supports multiple color/size variants per apparel product, each with unique SKU, barcode, cost price, selling price, current stock, and alert thresholds.
- **Duplicate SKU Guard**: Enforces unique SKUs at both backend validation and MongoDB index levels.
- **Catalog Management**: Quick product activation/deactivation, price range inspection, and expandable variant tables.

### 4. Stock & Inventory Management
- **Audit Log Movements**: Every stock change is permanently logged in `StockMovement` (types: `PURCHASE`, `SALE`, `RETURN`, `MANUAL_ADJUSTMENT`, `OPENING_STOCK`) with previous stock, new stock, staff actor, timestamp, and mandatory reason.
- **Manual Adjustments**: Owner can perform physical count adjustments with a mandatory audit reason.
- **Low-Stock Alerts**: Real-time badge in the top navigation bar and dedicated Low-Stock Watchlist alerting when stock reaches or drops below minimum thresholds.
- **Negative Stock Setting**: Prevent stock from going below 0 (toggleable in Settings).

### 5. Suppliers & Purchase Orders
- **Supplier Directory**: Manage vendor details, company names, contact numbers, and track cumulative outstanding balances.
- **Procurement Workflow**: Create Purchase Orders in `ordered` or `received` status.
- **Stock Increase on Receipt**: Inventory stock quantities increase **only when goods are marked as received**.
- **Payment Tracking**: Track unpaid, partially paid, and fully paid purchase orders, with partial payment recording.

### 6. Operational Expenses
- **Expense Logging**: Title, category (Rent, Electricity, Transport, Salaries, Supplies, Maintenance, Miscellaneous), amount, date, and notes.
- **Filters**: Filter expenses by category and date range with automated total sum aggregation.

### 7. Profit & Loss Financial Reports
- **Revenue vs. COGS**: Calculates exact Cost of Goods Sold (COGS) based on preserved item cost snapshots at time of sale.
- **Gross Profit**: `Gross Profit = Gross Revenue - COGS`.
- **Net Profit**: `Net Profit = Gross Profit - Operating Expenses`.
- **Returns & Refunds Accounting**: Excludes or reverses refunded sales while tracking refunded totals.
- **Category & Product Ranking**: Breakdown of units sold, revenue, gross margin, and profit margin percent by department and individual product.
- **Payment Reconciliation**: Separates actual cash collected from digital channels (Card, JazzCash, EasyPaisa).

### 8. User Security & Roles
- **Roles**: `owner` (full administrative rights) and `cashier` (POS sales and receipt viewing).
- **Authentication**: JWT authentication with bcrypt password hashing (10 salt rounds).
- **First-Run Setup Wizard**: Safe initialization wizard allows registering the primary Store Owner on fresh databases; locks out unauthorized public registrations once an owner exists.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router v6, Lucide React, Axios |
| **Backend** | Node.js (v18+), Express.js, Mongoose 8, JWT, bcryptjs, Morgan |
| **Database** | MongoDB (supports MongoDB Atlas, local MongoDB daemon, and auto-embedded dev fallback) |
| **Testing** | Node.js native test runner (`node:test`, `node:assert`) |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js `v18.0.0` or higher (`node -v`)
- npm `v9.0.0` or higher (`npm -v`)
- Optional: MongoDB installed locally or a free MongoDB Atlas connection URI. *(If MongoDB is not installed locally, ShopEase POS includes an automatic embedded In-Memory MongoDB server for instant zero-configuration development!)*

### Step 1: Install Dependencies
From the project root:
```bash
# Install root orchestration tools
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Step 2: Environment Configuration
Copy `.env.example` in `backend/` to `.env`:
```bash
cp backend/.env.example backend/.env
# On Windows PowerShell:
Copy-Item backend\.env.example backend\.env
```

`backend/.env` contents:
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
# Option A: Local MongoDB daemon:
MONGODB_URI=mongodb://127.0.0.1:27017/shopease_pos
# Option B: MongoDB Atlas cloud connection:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shopease_pos?retryWrites=true&w=majority

# Zero-Config Development: Automatically boots embedded In-Memory MongoDB if local mongod is offline
AUTO_FALLBACK_IN_MEMORY_DB=true

# Security (JWT)
JWT_SECRET=shopease_jwt_secret_dev_key_change_in_production_9876543210
JWT_EXPIRES_IN=7d

# Regional Configuration
TIMEZONE=Asia/Karachi
CURRENCY_CODE=PKR
ALLOW_NEGATIVE_STOCK=false

# Frontend Origin
CLIENT_URL=http://localhost:5173
```

> [!NOTE]
> Database credentials and secrets are kept strictly in backend `.env` and excluded via `.gitignore`. They are never bundled into or exposed to the React frontend.

### Step 3: Secure First-Owner Account Creation & Database Seeding

ShopEase POS **never** exposes a default hardcoded admin account in production. You can initialize the store owner using either of two safe methods:

#### Method A: Command-Line Interface (CLI Script)
Run the interactive CLI owner creation wizard in `backend`:
```bash
cd backend
npm run create-owner
```
You can also pass arguments directly in non-interactive environments:
```bash
node src/scripts/createOwner.js <username> <password> "<Full Name>" <email>
# Example:
node src/scripts/createOwner.js admin Owner@Secure2026 "Muhammad Ali" owner@shopease.pk
```

#### Method B: Web Setup Wizard (Browser)
1. Start the application (`npm run dev`).
2. Navigate to `http://localhost:5173`.
3. If no users exist in the database, the system automatically detects this via `GET /api/auth/setup-status` and displays the **First-Run Owner Setup Wizard**.
4. Fill in the Owner Full Name, Username, and Password (minimum 6 characters).
5. Upon submission, the owner account is created with `role: "owner"`. Subsequent access to the setup endpoint is permanently locked down (`403 Forbidden`).

#### Seed Initial System Categories & Settings:
To seed the standard system categories (**Clothing** and **General Store**) and initial store settings without overwriting existing accounts:
```bash
cd backend
npm run seed
```

### Step 4: Run Development Server
Start both backend and frontend concurrently from the root directory:
```bash
npm run dev
```

Or start each service individually:
- **Backend**: `cd backend && npm run dev` (Runs on `http://localhost:5000`)
- **Frontend**: `cd frontend && npm run dev` (Runs on `http://localhost:5173`)
- **Backend API Health Check**: `http://localhost:5000/api/health`

---

## 🖨️ Thermal Receipt Printing Guide

ShopEase POS is designed to produce compact, high-contrast receipts for 58 mm and 80 mm thermal roll printers.

### 1. Browser-Based Printing (Default)
1. Complete a sale in the POS terminal or click **"Reprint"** from the Receipts page.
2. The **Receipt Print Preview** modal opens with the rendered thermal layout.
3. Choose your paper width: **80 mm (Standard)** or **58 mm (Compact)**.
4. Click **"Print Receipt Now"** (or press `Ctrl + P`).
5. In the browser print dialog:
   - Select your thermal printer (e.g., *Xprinter, POS-58, POS-80, Epson TM-T20*).
   - Set **Margins:** `None` / `Minimum`.
   - Set **Paper Size:** `58mm` or `80mm` roll.
   - Uncheck **Headers and Footers**.
6. The dedicated `@media print` CSS ensures non-receipt elements are suppressed, printing only `#printable-receipt`.

### 2. Silent / Direct USB ESC/POS Printing Integration
For high-volume retail checkout lanes where cashiers require silent printing (bypassing the browser print dialog):
- **Web Browsers Sandbox**: Modern web browsers do not permit raw, silent binary access to USB devices without a system helper service due to sandbox security policies.
- **Recommended Silent Printing Solutions**:
  1. **QZ Tray** *(Industry Standard)*: A lightweight, cross-platform background service installed on the shop computer. ShopEase POS can send ESC/POS commands directly to USB thermal printers over a local WebSocket (`ws://localhost:8182`).
  2. **Raw ESC/POS Bridge Service**: A simple Node.js microservice (`node-escpos` or `electron` wrapper) running locally on the POS terminal that exposes an endpoint (e.g. `POST http://localhost:9100/print`) to send raw ESC/POS binary codes directly to the USB device path (e.g. `\\.\USB001` or `/dev/usb/lp0`).

> ℹ️ *Direct silent USB printing requires hardware driver bridge software on the host machine. The built-in browser print pipeline is fully operational across all USB thermal printers today.*

---

## 🧪 Testing & Verification Guide

### 1. Automated Integration Test Suite
The automated test suite runs via Node.js native test runner (`node:test`) and covers:
1. **Initial Owner Setup & Wizard Lockdown**: Verifies owner account creation, rejects duplicate setup attempts (403), verifies password validation, and prevents deactivated accounts from logging in.
2. **Category Management & Slug Engine**: Seeds system categories (`Clothing` and `General Store`), creates new categories, verifies slug auto-generation, blocks duplicate category names (409), and verifies `PATCH /api/categories/:id` updates and deactivations.
3. **Clothing vs General Store Product Modeling**: Creates multi-variant apparel with sizes, colors, SKUs, and stock; creates general store products with a single default variant; asserts duplicate SKU rejection across products and variants.
4. **Product Search, Filtering, Pagination, and Status Toggle**: Tests `GET /api/products` text search, SKU search, category filter, active status toggle (`PATCH /api/products/:id/status`), and cascading variant status updates.
5. **Role-Based Access Control**: Verifies cashiers are blocked from administrative routes (e.g., category creation, product updates).
6. **Purchases, Sales, Split Payments, Insufficient Stock Guard, and Financial Reports**.

To run all automated integration tests:
```bash
npm test
# Or inside backend:
cd backend && npm test
```

### 2. Manual UI Testing Walkthrough (Prompt 2 Focus)

#### Testing Authentication:
1. **Fresh Installation**: If no users exist, navigate to `http://localhost:5173/login`. The **Owner Setup Wizard** appears automatically. Fill in the form to bootstrap the first owner.
2. **Login**: Enter the owner username and password. On successful authentication, you are redirected to the Dashboard.
3. **Profile Check**: The top navigation displays the owner's name and role badge (`OWNER`). Clicking **"Sign Out"** terminates the session and returns you to the login screen.
4. **Cashier Login**: Owners can create cashiers in Users management. Log in with cashier credentials and observe that restricted tabs (Reports, Settings) are hidden, and backend attempts to mutate products/categories return `403 Forbidden`.

#### Testing Category Management:
1. Navigate to `/categories` from the sidebar navigation.
2. Verify pre-seeded categories: **Clothing** and **General Store** with their active status tags.
3. Click **"New Category"** and create a category (e.g., `Accessories`). Verify the category slug is generated automatically.
4. Try creating another category with the same name (`Accessories`); verify the backend rejects it with an explicit duplicate name error toast.
5. Click **"Edit"** on a category to rename or toggle its active/inactive status. Verify the table updates instantly.

#### Testing Product Management:
1. Navigate to `/products` from the sidebar navigation.
2. **Clothing Products**:
   - Click **"Add Product"**.
   - Select Category: **Clothing**.
   - Notice the form switches to the **Clothing Variant Editor**, enabling you to add rows specifying **Size** (S, M, L, XL), **Color** (e.g., Blue, Black), **SKU**, **Cost Price**, **Selling Price**, **Opening Stock**, and **Low-Stock Alert**.
   - Add multiple variants and click **"Save Product"**.
3. **General Store Products**:
   - Click **"Add Product"**.
   - Select Category: **General Store**.
   - Notice the form switches to the streamlined **General Store Default Variant** layout, requiring only SKU, prices, and stock without forcing sizes or colors.
4. **Duplicate SKU Prevention**:
   - Try adding a new product or variant with an already existing SKU. Notice the backend intercepts it with an HTTP 409 conflict error.
5. **Search & Filters**:
   - Type a product name or SKU in the search input to test real-time search.
   - Filter by Category dropdown to view only Clothing or General Store items.
   - Filter by Status (Active / Inactive).
6. **Product Details & Status Toggle**:
   - Click on any product row to open the full **Product Details Modal**, viewing all variant SKUs, cost prices, selling prices, and current stock.
   - Toggle the active status switch on a product row to deactivate/reactivate it and confirm cascading status updates to its variants.

---

## 📁 Project Structure

```
SHOPEASE_POS/
├── package.json                 # Monorepo development scripts
├── .gitignore                   # Version control exclusions
├── README.md                    # System documentation
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   ├── server.js                # Express app entrypoint & graceful shutdown
│   ├── src/
│   │   ├── config/              # Database connection & constants
│   │   │   ├── db.js
│   │   │   └── constants.js
│   │   ├── models/              # Mongoose schema models
│   │   │   ├── User.js
│   │   │   ├── Category.js
│   │   │   ├── Product.js
│   │   │   ├── ProductVariant.js
│   │   │   ├── Supplier.js
│   │   │   ├── Purchase.js
│   │   │   ├── Sale.js
│   │   │   ├── SalePayment.js
│   │   │   ├── Expense.js
│   │   │   ├── StockMovement.js
│   │   │   └── Setting.js
│   │   ├── middleware/          # JWT auth & error handler
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── controllers/         # Business logic & calculations
│   │   ├── routes/              # Express REST API routes
│   │   ├── services/            # Stock audit trail & Receipt sequencing
│   │   └── scripts/             # Initial database seeder
│   └── tests/
│       └── api.test.js          # Automated integration test suite
└── frontend/
    ├── package.json
    ├── vite.config.js           # API proxy & build configuration
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── api/client.js        # Axios instance with JWT interceptor
        ├── utils/formatters.js  # PKR currency & Asia/Karachi time
        ├── context/             # Auth, Cart, and Toast Notification state
        ├── components/          # Sidebar, Navbar, ThermalReceipt, Modals
        └── pages/               # POS, Dashboard, Products, Stock, Reports...
```

---

## 🔒 Security Best Practices

1. Passwords hashed using bcrypt with salt factor 10.
2. Route middleware verifies token expiration and active account status on every call.
3. Sensitive financial reports and user management are strictly restricted to the `owner` role.
4. Database credentials and secrets are kept in environment variables and excluded via `.gitignore`.
5. No publicly exposed registration endpoint once initial setup is finalized.

---

## 📄 License
MIT License. Developed for ShopEase POS retail operations.
