# 🚀 Modern Temporary File Sharing System (Temp Share)

A secure, blisteringly fast, and beautifully designed production-quality temporary file sharing platform built with **React**, **Vite**, **Tailwind CSS v4**, and **Firebase**. 

Users can upload single or multiple files (up to 500MB) via click or drag-and-drop, track progress live, preview files inline directly in the browser, and share safe download links. To maintain strict compliance and optimized storage footprints, **every file automatically expires and is permanently purged after exactly 1 hour**.

---

## ✨ Features

### 📤 Upload Engine
- **Drag-and-Drop & File Browser**: Fully optimized for both desktop pointers and mobile touch areas.
- **Resumable Uploads**: Progress percentage counters with glowing track paths, powered by resumable streams.
- **Queue Controls**: Allows users to cancel ongoing uploads or instantly retry failed transfers.
- **Security & Validation**: Strict 500MB file size limits enforced on both client and Firebase Storage rules.

### 📋 Interactive File Grid
- **Real-Time Synchronisation**: Reflects file uploads, downloads, and deletions instantly across all sessions using Firestore `onSnapshot` subscriptions.
- **Reactive Countdowns**: Updates expiration timers ("Expiring in 58m 12s") second-by-second.
- **Instant Search**: Live filters files matching on filename, extension, or MIME type.
- **Advanced Sorting**: Categorize or order shares by Newest, Oldest, Name, Size, or File Type.
- **Dynamic File Icons**: Richly themed icons for specific formats (Images, Audio, Videos, PDFs, Archives, and Code).

### 🔍 Native Browser Previews
- **Images**: High-contrast, edge-to-edge preview with modern referer protection.
- **Audio & Video**: Elegant HTML5 players with custom immersive surround visualizations.
- **PDF Documents**: Direct embedded sandbox `iframe` view with fallback external opening.
- **Text & Source Code**: Performs a live text stream fetch to display scrollable source contents with error fallbacks.

### 🛡️ Double-Tier Automatic Purge
1. **Client-Side Live Expiry**: The moment a file reaches its 1-hour lifetime limit, the app filters it from the list and triggers an automatic background storage & metadata delete.
2. **Serverless Scheduled Purge**: A scheduled Cloud Function triggers every 5 minutes in the background, cleaning up any stale storage objects and orphaned metadata documents.
3. **No Orphan Policy**: Guaranteed alignment—deleting a Firestore document deletes its storage block, and vice-versa.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion (Animations), Lucide React (Icons).
- **Database & Metadata**: Firebase Firestore (custom named database ID target).
- **Object Storage**: Firebase Cloud Storage.
- **Identity & Security**: Firebase Authentication (Sessionless background Anonymous Auth).
- **Serverless Automation**: Firebase Scheduled Cloud Functions v2.
- **CI/CD Pipeline**: GitHub Actions + Firebase Tools.

---

## 📂 Folder Structure

```text
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml     # CI/CD automated push deployment pipeline
├── functions/                      # Serverless Cloud Functions (Node 18 + TS)
│   ├── src/
│   │   └── index.ts                # Scheduled 5-minute cleanup trigger
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── components/
│   │   ├── FileGrid.tsx            # Search, filter, sorting, and file list
│   │   ├── PreviewModal.tsx        # Dynamic native media and code player modal
│   │   ├── ToastContainer.tsx      # Scale-and-fade toast alert manager
│   │   └── UploadZone.tsx          # Drag & drop resumable progress tracker
│   ├── firebase/
│   │   └── config.ts               # Custom Firestore & Storage initialization
│   ├── App.tsx                     # Global layout, auth controller, & stats metrics
│   ├── index.css                   # Custom Tailwind v4 themes & glass styles
│   ├── main.tsx                    # React mounting entry point
│   └── types.ts                    # Declared shared data interfaces
├── .firebaserc                     # Project alias mapping
├── firebase.json                   # Hosting, Rules, and Cloud Functions mappings
├── firestore.rules                 # Robust custom database security rules
├── storage.rules                   # Storage permission and size policy rules
├── package.json                    # Package metadata & build scripts
└── tsconfig.json                   # Strict TypeScript compiler configuration
```

---

## ⚙️ Environment Variables

A `.env.example` file is included in the workspace:

```env
# GEMINI_API_KEY: Required for potential Gemini API integrations (handled server-side)
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: Injectable runtime URL for the cloud application
APP_URL="MY_APP_URL"
```

---

## 🚀 Setup & Local Installation

### 1. Prerequisites
- **Node.js** v18+ and **npm** installed on your local system.
- A **Firebase Project** configured with Firestore, Storage, and Anonymous Authentication enabled.

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/your-username/temp-share.git
cd temp-share

# Install dependencies
npm install

# Run Vite local development server (runs on port 3000)
npm run dev
```

---

## 🔒 Firebase Configuration & Setup

1. **Enable Anonymous Auth**:
   - Go to your [Firebase Console](https://console.firebase.google.com/).
   - Select **Authentication** -> **Sign-in method** -> Enable **Anonymous**.

2. **Configure Firestore**:
   - Go to **Firestore Database**.
   - Create a database (production rules will be deployed from `firestore.rules`).

3. **Configure Storage**:
   - Go to **Storage**.
   - Enable Cloud Storage for your project.

4. **Verify database ID**:
   - If your project utilizes a custom Firestore database ID, ensure it is set inside `/src/firebase/config.ts` and `functions/src/index.ts`.

---

## 🚢 CI/CD Deployment Guide (GitHub Actions)

This project is pre-configured to build and deploy to Firebase automatically on every push to the `main` branch.

### 1. Get Firebase CI Token or Service Account
Generate a service account key inside your Google Cloud Console for the Firebase project, with roles:
- `Firebase Admin`
- `API Keys Admin`

### 2. Add Secret to GitHub Repository
1. Go to your GitHub repository.
2. Select **Settings** -> **Secrets and variables** -> **Actions**.
3. Create a **New repository secret**:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire JSON content of your downloaded service account key.

### 3. Push to Deploy
Simply commit your changes and push to `main`:
```bash
git add .
git commit -m "feat: complete production temporary file share system"
git push origin main
```
GitHub Actions will capture the push, install dependencies, compile TypeScript, run the linter, and deploy to Firebase Hosting and Cloud Functions!

---

## 🛡️ Security Rules Breakdown

### Firestore Metadata Rules (`firestore.rules`)
- **Public Read**: Anyone with the link can query file metadata to trigger downloads and previews.
- **Verified Create**: Limit database creation requests to signed-in anonymous sessions. File sizes must be `<= 500MB` and filenames must be present.
- **Verified Delete**: Only the original uploader (checked against their anonymous session UID) is allowed to delete file metadata.

### Storage Rules (`storage.rules`)
- **Public Read**: Anyone can read/stream files from the designated uploads folder.
- **Verified Create**: Restricts uploads to authenticated users, limits sizes to `<= 500MB`, and requires setting `uploaderUid` in custom metadata.
- **Verified Delete**: Restricts storage block removals to the original anonymous uploader.

---

## 🔮 Future Improvements
- **Password Protection**: Let uploaders option a secure cryptographic passphrase.
- **One-Time Download Limit**: Support "burn on download" shares that self-destruct immediately after 1 download.
- **Zipped Folder Downloads**: Allow users to download all items in multiple uploads as a single grouped `.zip`.

---

## 📄 License

This project is open-source and licensed under the [Apache 2.0 License](LICENSE).
