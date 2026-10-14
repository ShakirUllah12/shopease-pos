# ShopEase POS — Vercel Deployment Step-by-Step Guide

This guide explains how to deploy the complete **ShopEase POS** web application (Frontend React SPA + Serverless Express Backend) to **Vercel** with a free MongoDB Atlas cloud database.

Once deployed on Vercel, you will have a live secure URL (e.g., `https://shopease-pos.vercel.app`) that you can:
1. Share with your client immediately for live testing.
2. Use as the base URL to generate your **Google Play Store Android App** using Bubblewrap TWA.

---

## 📋 Prerequisites (All 100% Free)

1. A **GitHub Account**: [github.com](https://github.com)
2. A **Vercel Account**: [vercel.com](https://vercel.com) (Sign up with GitHub)
3. A **MongoDB Atlas Account**: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (Free 512MB M0 cluster forever)

---

## 🗄️ Step 1: Create Free MongoDB Cloud Database (5 Minutes)

Because Vercel runs in a serverless cloud environment, a persistent cloud database is required:

1. Log into [MongoDB Atlas](https://cloud.mongodb.com).
2. Click **Build a Database** and select the **FREE Shared (M0)** tier.
3. Choose a cloud provider and region closest to Pakistan (e.g., **AWS / Mumbai (`ap-south-1`)** or **Singapore**).
4. **Create Database User**:
   - Username: `shopease_admin`
   - Password: Click *Autogenerate Secure Password* or choose a strong password (e.g., `ShopEasePass2026!`).
   - Click **Create User**.
5. **Configure Network Access**:
   - Under *Where would you like to connect from?*, choose **My Local Environment**.
   - In IP Address, click **Allow Access from Anywhere** (`0.0.0.0/0`).
     *(This is required because Vercel serverless functions use dynamic IP addresses).*
6. **Get Connection String**:
   - Go to **Database > Connect > Drivers (Node.js)**.
   - Copy the connection string, which looks like:
     ```text
     mongodb+srv://shopease_admin:<password>@cluster0.abcde.mongodb.net/shopease_pos?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual database user password.

---

## 🐙 Step 2: Push Your Code to GitHub

Open terminal in the project folder `e:\MY_PROJECTS\SHOPEASE_POS` and run:

```bash
git add .
git commit -m "Configure ShopEase POS for Vercel fullstack deployment"
```

If you haven't connected a GitHub repository yet:
```bash
# Create a new repository on github.com (e.g. "shopease-pos")
git remote add origin https://github.com/YOUR_USERNAME/shopease-pos.git
git branch -M main
git push -u origin main
```

---

## 🚀 Step 3: Deploy to Vercel via Website UI (Easiest)

1. Open your browser and go to [vercel.com/new](https://vercel.com/new).
2. Find your **`shopease-pos`** repository and click **Import**.
3. In the project configuration:
   - **Framework Preset**: Select **Vite** (or leave as Other).
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `npm run build` (automatic from `vercel.json`).
   - **Output Directory**: `frontend/dist` (automatic from `vercel.json`).
4. **Environment Variables**:
   Expand the **Environment Variables** section and add the following 4 variables:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `MONGODB_URI` | `mongodb+srv://shopease_admin:...` | Your MongoDB Atlas connection string from Step 1 |
   | `JWT_SECRET` | `shopease_super_secure_jwt_secret_key_2026` | Any secure random string for login tokens |
   | `TIMEZONE` | `Asia/Karachi` | Pakistani retail timezone |
   | `CURRENCY_CODE` | `PKR` | Pakistani Rupee currency |

5. Click **Deploy**!
6. Vercel will install dependencies, build the frontend, package the serverless API, and give you your live URL in about 60 seconds (e.g. `https://shopease-pos.vercel.app`).

---

## ⚡ Alternative: Deploy via Vercel CLI (From Command Line)

If you prefer deploying directly from your terminal:

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy to production
vercel --prod
```

When prompted:
- Set up and deploy? **Yes**
- Which scope? Select your personal account
- Link to existing project? **No**
- What's your project's name? **shopease-pos**
- In which directory is your code located? **`./`**
- Want to modify settings? **No**

Then add your environment variables:
```bash
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
```

---

## 🔍 Step 4: Verify Your Live Vercel Deployment

Once deployment completes:
1. **Public Customer Website**: Visit `https://your-app.vercel.app/store`
   - Test browsing products and placing a WhatsApp order.
2. **First-Time Owner Setup**: Visit `https://your-app.vercel.app/login`
   - Fill in your Owner account details (Name, Username, Password).
   - The system will auto-seed the complete 172-product catalog directly into your MongoDB Atlas cloud database!
3. **POS Terminal**: Test searching products, camera scanning, Raast QR code modal, and customer Khata ledger.

---

## 📱 Next Step: Publish to Google Play Store

Once your Vercel app is live:
1. Follow our [`PLAYSTORE_APP_GUIDE.md`](./PLAYSTORE_APP_GUIDE.md).
2. Run Bubblewrap with your Vercel URL:
   ```bash
   bubblewrap init --manifest=https://your-app.vercel.app/manifest.json
   bubblewrap build
   ```
3. Upload the generated `app-release-bundle.aab` directly to Google Play Console!
