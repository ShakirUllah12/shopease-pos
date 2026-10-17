# 🛍️ ShopEase POS — Client Quick Start & Product Addition Guide

Welcome to **ShopEase POS**! This enterprise retail system is designed for 100% offline shop operations with zero coding knowledge required. You **never** need VS Code or programming to add products, change prices, or print receipts.

---

## 1. How to Add New Products to Your Shop (2 Easy Ways)

### Method A: Direct Quick Add from POS Screen (Fastest)
Whenever new stock arrives at your shop counter:
1. Open the POS Terminal billing screen.
2. At the top toolbar (next to Camera Scan), click the blue **`+ New Product`** button.
3. Enter product details:
   - **Product Name**: e.g., *Cotton Polo Shirt* or *Basmati Rice 5kg*
   - **Category**: Select *Clothing* or *General Store*
   - **Sale Price (Rs.)**: The price your customer pays
   - **Cost Price (Rs.)**: Your purchase/wholesale cost (for profit tracking)
   - **Stock Quantity**: Number of units received in your shop
   - **Barcode / SKU**: Scan with your barcode scanner or leave blank to auto-generate
4. Click **`Save Product & Ready to Sell`**.
5. The product is immediately in your catalog ready for instant scanning and sale!

### Method B: Detailed Product & Variant Editor
For items with multiple sizes and colors (e.g. Small, Medium, Large, Navy, Black):
1. In the left navigation menu, click **`Products & Variants`**.
2. Click **`+ Add New Product`** in the top right.
3. Configure:
   - Department: Clothing (Sizes/Colors) or General Store
   - Add size/color rows with individual SKUs and prices.
4. Click **`Save Product & Variants`**.

---

## 2. Default Staff & Owner Credentials

- **Username**: `owner`
- **Password**: `Owner@123456`
*(You can change this password or add cashiers in Store Settings & Staff Accounts).*

### Single Active Session Security
To safeguard your cash drawer and daily sales ledger, each staff account operates on **1 active terminal at a time**. If an account logs in on another terminal, the system smoothly switches the active session to that device.

---

## 3. How to Launch and Update Offline

### First-Time Desktop Setup
Double-click **`CREATE_DESKTOP_SHORTCUT.bat`**. This places a desktop icon on your Windows desktop so you can launch POS directly with 1 click.

### Daily Operation
Double-click **`START_SHOPEASE_POS.bat`** (or your Desktop icon). The POS server initializes and opens in your default browser at `http://localhost:5000/pos`.

### 1-Click System Updates
When your software vendor provides an update, simply double-click **`UPDATE_SHOPEASE_POS.bat`**. It compiles and applies all improvements automatically.

---

## 4. Software License Verification
Your installation is permanently registered with a **Lifetime Perpetual License**. All billing, khata ledgers, barcode printing, and profit/loss reports work completely offline without internet requirement.
