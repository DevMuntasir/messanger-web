# Quick Setup Guide

## Getting Started in 3 Steps

### Step 1: Install Dependencies

```bash
cd web
npm install
```

This will install all required packages:
- React 19 & React DOM
- Vite (fast build tool)
- Socket.io client (real-time messaging)
- Firebase (authentication)
- Axios (API calls)

### Step 2: Configure Environment

The `.env` file is already pre-configured with your Firebase credentials from the mobile app. No changes needed unless:

- Backend API URL changed → Update `VITE_API_URL`
- Firebase project changed → Update Firebase credentials

### Step 3: Run Development Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## File Structure Overview

```
web/
├── src/
│   ├── pages/              # Full page screens
│   │   ├── LoginPage.jsx   # Google Sign-In
│   │   ├── InboxPage.jsx   # Conversation list
│   │   └── ChatPage.jsx    # Main messaging screen
│   ├── components/         # UI components (Avatar, Bubble, etc.)
│   ├── context/           # Auth & Socket contexts
│   ├── hooks/             # Data fetching hooks
│   ├── services/          # API & Socket clients
│   ├── config/            # Firebase setup
│   └── styles/            # CSS files
├── package.json           # Dependencies
├── .env                   # Environment config
├── vite.config.js         # Build config
└── index.html             # HTML entry point
```

## Key Features

✅ **Web + Mobile Sync** - Same messages, conversations, status across all devices  
✅ **Real-Time** - Instant delivery with Socket.io WebSocket  
✅ **Responsive** - Works on desktop, tablet, and mobile web  
✅ **Authentication** - Google Sign-In with Firebase  
✅ **Same UI** - Matches your mobile app design exactly  

## How to Connect Web to Mobile

1. **Same Backend** - Both web and mobile connect to the same API server
2. **Same Firebase Project** - Both use the same Firebase authentication
3. **Same User Account** - Log in with the same Google account on both
4. **Real-Time Sync** - Messages instantly sync via WebSocket

**Test it:**
- Open web app on desktop
- Open mobile app on phone
- Send message from web → appears on mobile instantly
- Send message from mobile → appears on web instantly
- Type on one → "typing..." shows on the other

## Commands

```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Troubleshooting

**"Cannot find module" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Connection errors:**
- Check `VITE_API_URL` in `.env` matches your backend
- Ensure backend API is running
- Check network tab in DevTools for failed requests

**Messages not syncing:**
- Check browser console for WebSocket errors
- Verify you're logged in with same account on both devices
- Check Socket.io says "connected" in console

**Firebase login not working:**
- Verify Firebase credentials in `.env` are correct
- Check Firebase console allowed redirect URIs includes `http://localhost:3000`

## Production Deployment

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder to your hosting:**
   - Netlify: Connect GitHub repo, set build command to `npm run build`
   - Vercel: Same process
   - Docker: Use `node:18` image, run vite build, serve dist/
   - AWS/GCP: Upload dist/ to static hosting

3. **Update Firebase:**
   - Add production domain to authorized JavaScript origins
   - Add production URL to Google OAuth redirect URIs

## Next Steps

1. ✅ Install and run locally
2. ✅ Test with mobile app
3. ✅ Customize styling if needed (CSS variables in `src/styles/global.css`)
4. ✅ Deploy to production

## Architecture Notes

**Shared Code:**
- Context setup (Auth, Socket)
- API client with Firebase authentication
- Socket.io service for real-time
- Hooks (useMessages, useConversations)
- All reusable between web and mobile

**Web-Only:**
- React components (web version of React Native)
- CSS styling
- Vite build setup
- HTML/browser APIs

**Mobile-Only:**
- React Native components
- Expo configuration
- Native platform code (iOS/Android)

All three connect to the **same backend API** = unified messaging experience! 🚀
