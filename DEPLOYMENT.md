# Deployment Guide: Cordwainers Studio

This application is built with a full-stack architecture (Vite + Express) and uses Firebase for persistence. You can deploy it to third-party platforms like **Render**, **Heroku**, or **DigitalOcean**.

## 🚀 Deploying to Render (Recommended)

Render is ideal for this application as it supports full-stack Express servers.

1. **Connect GitHub**: Push your code to a GitHub repository and connect it to Render.
2. **Create Web Service**: Select the repository.
3. **Environment Settings**:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables**: Add the following variables from your `.env.example`:
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: (Your Google AI API Key)
   - `VITE_FIREBASE_API_KEY`: (From your Firebase project)
   - ... and all other `VITE_FIREBASE_*` variables.

## 🛠️ Deploying to GitHub Pages (Frontend Only)

**Note**: Since this app uses an Express backend for notifications and Google Sheets sync, those specific features will **not work** on GitHub Pages (which only hosts static files).

If you want to host the frontend only:
1. Update `vite.config.ts` if your repository is not at the root domain (e.g., `base: '/repo-name/'`).
2. Run `npm run build`.
3. Deploy the contents of the `dist` folder to the `gh-pages` branch.

## 📱 Mobile Optimizations

The app is optimized for mobile performance:
- **Zero-Bounce Layout**: Uses `overscroll-behavior: none` to prevent browser rubber-banding.
- **Hardware Acceleration**: Animations use `motion/react` (Framer Motion) for GPU-accelerated smoothness.
- **Dynamic Viewports**: Responsive design using Tailwind CSS utility classes.
- **Offline First**: Uses Zustand persistence to ensure the app works even with spotty connectivity.

## 🧪 Development

To run locally:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).
