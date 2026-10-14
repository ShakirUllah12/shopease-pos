# ShopEase POS — Google Play Store App Publishing Guide

This guide provides complete, step-by-step instructions for converting **ShopEase POS** into a native Android app (`.aab` / `.apk`) and publishing it to the **Google Play Store**.

ShopEase POS includes a pre-configured **Progressive Web App (PWA)** with a Web App Manifest (`manifest.json`), service worker offline caching, responsive layouts, and camera barcode scanner support.

---

## 🎯 Recommended Packaging Approaches

| Feature | Method 1: Google Bubblewrap (TWA) - **Recommended** | Method 2: Capacitor Android |
| :--- | :--- | :--- |
| **Best For** | Instant Play Store publishing, seamless live updates without re-building APK | Native hardware plugins (USB/Bluetooth direct thermal printing) |
| **Google Recommended?** | Yes (Official Google Trusted Web Activity) | Yes (Ionic / Capacitor ecosystem) |
| **APK / AAB Size** | Very lightweight (~1.5 MB - 3 MB) | ~5 MB - 10 MB |
| **Automatic Updates** | Yes (Updates automatically whenever web server updates) | Requires app rebuild for native code changes |
| **Tooling Required** | Node.js + Java JDK 17 + Android CLI tools | Node.js + Android Studio |

---

## 🚀 Method 1: Google Bubblewrap CLI (Fastest & Google Recommended)

Google Bubblewrap uses **Trusted Web Activity (TWA)** to wrap your hosted ShopEase POS web application into a Google Play-compliant Android App Bundle (`.aab`).

### Step 1: Deploy ShopEase POS with HTTPS
Google Play requires your application to run on a secure domain (e.g. `https://pos.yourstore.com` or `https://shopease-pos.vercel.app` / Railway / VPS).
Verify that `https://your-domain.com/manifest.json` is publicly accessible.

### Step 2: Install Bubblewrap CLI
Open your terminal (PowerShell or Bash) and run:
```bash
npm install -g @bubblewrap/cli
```

### Step 3: Initialize the Android Project
Run the Bubblewrap interactive setup wizard:
```bash
bubblewrap init --manifest=https://your-domain.com/manifest.json
```
Bubblewrap will automatically download Android build tools if needed and prompt for:
- **Application Name**: `ShopEase POS`
- **Short Name**: `ShopEase`
- **Application ID (Package Name)**: `com.shopease.pos`
- **Display Mode**: `standalone` (or `fullscreen`)
- **Icon URL**: `https://your-domain.com/icon-512.svg`
- **Signing Key**: Choose "Create a new keystore" and store your password safely.

### Step 4: Verify Digital Asset Links (TWA Verification)
To remove the browser address bar in the Android app, establish domain ownership:
1. Bubblewrap generates an `assetlinks.json` file containing your SHA-256 app certificate fingerprint.
2. Upload this file to your web server at:
   `https://your-domain.com/.well-known/assetlinks.json`
3. This verifies to Google Play that you own both the website and the Android app.

### Step 5: Build the Signed Android App Bundle (`.aab`)
Run:
```bash
bubblewrap build
```
This generates:
- `app-release-bundle.aab` (Ready for Google Play Store upload)
- `app-release-signed.apk` (Ready for direct installation on Android phones/tablets via USB)

---

## 🛠️ Method 2: Ionic Capacitor (For Native Hardware & Offline Packaging)

If you wish to bundle the complete React bundle locally inside the APK:

### Step 1: Install Capacitor in `frontend`
```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 2: Initialize Capacitor Configuration
```bash
npx cap init "ShopEase POS" "com.shopease.pos" --web-dir "dist"
```

### Step 3: Build the Web App & Add Android Platform
```bash
npm run build
npx cap add android
```

### Step 4: Open in Android Studio
```bash
npx cap open android
```
In Android Studio:
1. Wait for Gradle sync to complete.
2. Connect your Android phone or use the emulator.
3. Click **Run > Run 'app'** to test.
4. Go to **Build > Generate Signed Bundle / APK...**
5. Select **Android App Bundle**, select your Release Keystore, and click **Finish**.

---

## 📋 Google Play Console Submission Checklist

### 1. Google Play Developer Account
- Go to [Google Play Console](https://play.google.com/console).
- Register an account ($25 one-time registration fee).

### 2. Create New App
- App Name: `ShopEase POS — Retail Billing & Shop Management`
- Default language: `English (United States)`
- App or Game: `App`
- Free or Paid: `Free`

### 3. Store Listing Assets
Prepare the following graphic assets:
- **App Icon**: 512x512 PNG (Use `icon-512.svg` converted to PNG).
- **Feature Graphic**: 1024x500 PNG (Banner highlighting POS billing, barcode scanner, and customer Khata).
- **Phone Screenshots**: Minimum 4 screenshots (POS billing screen, camera barcode scanner, customer Khata ledger, Day-End Z-Report).
- **7-inch / 10-inch Tablet Screenshots**: Landscape screenshots of the POS register.

### 4. App Content & Permissions
- **Camera Permission**: Explain that camera access is used for scanning 1D retail barcodes and 2D QR payment codes.
- **Privacy Policy**: Provide a link to your store privacy policy (e.g. `https://your-domain.com/privacy`).
- **Data Safety Form**: Declare that customer records are stored securely on the store's MongoDB server.

### 5. Production Release
1. Go to **Release > Production > Create new release**.
2. Upload `app-release-bundle.aab`.
3. Enter Release Notes (e.g., *"Initial production release of ShopEase POS with Barcode Scanning, Raast QR payments, and Khata Ledger."*).
4. Review and click **Start Rollout to Production**!

---

## 🌐 Public Customer Website Storefront

In addition to the Android app, ShopEase POS includes a public website storefront:
- **URL**: `https://your-domain.com/store`
- **Features**:
  - Live catalog browsing with real-time stock availability.
  - Category filters: Clothing, General Store, Groceries, Accessories.
  - Size & Color variant selectors.
  - WhatsApp Cart: One-click order checkout sending complete item details, quantities, prices, and delivery address directly to the shop owner's WhatsApp number.
- **Staff Access**: Fast link in the header allowing cashiers and store owners to log into the POS billing counter.
