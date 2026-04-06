# Free Deployment Guide: Smart College ERP

This guide will walk you through exactly how to deploy your College ERP project on the internet **100% for free**, so your clients can access it anywhere.

We will use the best free platforms:
1. **Frontend (React)**: Vercel (Fast, Free, Perfect for Vite)
2. **Backend (Node.js)**: Render.com (Has a great free tier for Node APIs)
3. **Database**: MongoDB Atlas (Your DB is already on Atlas, so we keep using it!)

---

## 1. Prepare Your Code for GitHub
You need to put your code on a GitHub repository first. Both Render and Vercel will pull your code directly from GitHub.

1. Create a free account at [GitHub.com](https://github.com/) if you don't have one.
2. In your terminal, run these commands in your `project/ERP` folder:
   ```bash
   git init
   git add .
   git commit -m "Ready for production"
   ```
3. Create a **New Repository** on GitHub (name it `smart-erp`) and push your code using the instructions GitHub gives you.

---

## 2. Deploy the Backend (for free on Render)

1. Go to [Render.com](https://render.com/) and sign up using your GitHub account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `smart-erp` repository.
4. **Configuration:**
   - **Name**: `smart-college-erp-api`
   - **Root Directory**: `backend` (Super important! Tells Render where the backend is)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node server.js`)
   - **Instance Type**: Select **Free**
5. **Environment Variables**: Scroll down to Advanced/Environment Variables and add:
   - `MONGO_URI`: *Your MongoDB connection string*
   - `JWT_SECRET`: *Any random string*
   - `NODE_ENV`: `production`
6. Click **Create Web Service**. 
7. *Wait 2-3 minutes.* Render will give you a live URL like `https://smart-college-erp-api.onrender.com`. Copy this!

---

## 3. Deploy the Frontend (for free on Vercel)

Now we deploy the UI so anyone can see it!

1. Go to [Vercel.com](https://vercel.com/) and sign up with GitHub.
2. Click **Add New** -> **Project**.
3. Import your `smart-erp` repository.
4. **Configuration:**
   - **Framework Preset**: Default is usually Vite, or leave as is.
   - **Root Directory**: Click "Edit" and type `frontend` (Super important!)
5. **Environment Variables**: Expand Environment Variables and add:
   - **Name**: `VITE_API_URL`
   - **Value**: *Paste the URL you got from Render!* (Example: `https://smart-college-erp-api.onrender.com/api`)
6. Click **Deploy**.
7. *Wait 1 minute.* Vercel will give you a live frontend URL like `https://smart-erp.vercel.app`.

---

## 4. Final Security Check (CORS)

Your backend needs to know that your Vercel frontend is allowed to talk to it.

1. Go back to Render.com -> Your Web Service -> **Environment**.
2. Add a new variable:
   - **Name**: `CLIENT_URL`
   - **Value**: *Your Vercel URL* (Example: `https://smart-erp.vercel.app`)
3. Click **Save Changes**. Render will automatically restart.

## 🎉 You're Done!
Your app is now live! Send the Vercel URL to your client. They can log in as Admin at `admin@college.edu` with password `123456`!
