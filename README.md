# ReferAI - "Azuga-Powered" Pilot

ReferAI is an AI-powered social referral platform designed for the Israeli market (Pilot Phase). It connects Providers (Campaign Owners) with Promoters (Influencers/Affiliates) to generate high-quality leads via social media.

## 🚀 Features

*   **Premium Glassmorphic UI**: High-end aesthetic with deep blue gradients and smooth animations suitable for the Azuga brand.
*   **Bilingual Support**: Full Hebrew (RTL) and English (LTR) support (`next-intl`).
*   **Campaign Wizard**: Create campaigns with **AI Content Generation** for WhatsApp, Instagram, LinkedIn, Facebook, Twitter, and TikTok.
*   **Role-Based Dashboards**:
    *   **Provider**: Create campaigns, track leads, sync with **Azuga CRM** (Mock).
    *   **Promoter**: Find campaigns, generate links, view earnings (Manual Payouts).
*   **Authentication**: Secure login via Supabase (Email, Facebook, Google).

## 🛠 Tech Stack

*   **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion.
*   **Backend / DB**: Supabase (PostgreSQL, Auth), Next.js Server Actions.
*   **Language**: TypeScript.

## 🏃‍♂️ How to Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Ensure `.env` contains your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

4.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## 🧪 Testing the Pilot Flow

1.  **Login**: Access `/login`. Use Email or Social Auth.
2.  **Provider Flow**:
    *   Go to **Provider Dashboard**.
    *   Click **"Sync from Azuga CRM"** to populate mock campaigns.
    *   Or click **"Create Campaign"** to use the Wizard + AI Generator.
3.  **Promoter Flow**:
    *   Switch to **Promoter Dashboard**.
    *   See active campaigns and simulate "Link Generation".

## ☁️ Deployment

### Option 1: Vercel (Recommended)
The easiest way to deploy Next.js apps.
1.  Push code to GitHub to your own repository.
2.  Import project into Vercel.
3.  Add Environment Variables in Vercel settings:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4.  Deploy!

### Option 2: Docker (Railway / Render)
We have included a `Dockerfile` for containerized hosting.
1.  Set up a project on Railway or Render.
2.  Link your GitHub repo.
3.  It will automatically detect the `Dockerfile`.
4.  Add your Environment Variables in the service settings.
5.  Deploy.

## 📄 License
Private - Azuga Marketing.
