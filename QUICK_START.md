# ⚡ Quick Start - 3 Minutes to Running

## Copy-Paste Commands

### 1. Install & Run (One Command)

```bash
cd web && npm install && npm run dev
```

### 2. Open in Browser

```
http://localhost:3000
```

### 3. Log In

- Click "Sign in with Google"
- Use same account as mobile app
- Done! Messages sync in real-time

---

## Testing Web ↔ Mobile

### Scenario: Send message from web to mobile

1. **Open web:** `localhost:3000`
2. **Open mobile:** Run your React Native app
3. **Both logged in:** Same Google account
4. **On web:** Send a message
5. **On mobile:** Message appears instantly ✨

### Scenario: See typing indicator

1. **On web:** Start typing in message input
2. **On mobile:** See "typing…" appear
3. **Stop typing:** Indicator disappears after 2 seconds

### Scenario: See online status

1. **Open mobile app:** Go online
2. **On web:** See green dot next to name
3. **Close mobile app:** Green dot disappears

---

## Useful Commands

```bash
# Start dev server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install new package
npm install axios

# Clear node_modules and reinstall
rm -rf node_modules && npm install
```

---

## File Locations

```
web/
├── src/pages/          ← Change page UI here
├── src/components/     ← Modify components
├── src/styles/         ← Edit colors/fonts (global.css)
├── .env                ← Change API URL if needed
└── package.json        ← Dependencies
```

---

## Common Customizations

### Change Colors

Edit `src/styles/global.css`:

```css
:root {
  --color-accent: #9b5cff;      /* Purple */
  --color-accent-light: #b66bff; /* Light purple */
  --color-accent-dark: #7c5cff;  /* Dark purple */
  /* ... other colors ... */
}
```

### Change Fonts

Edit `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT&display=swap" rel="stylesheet">
```

### Change Backend URL

Edit `.env`:

```env
VITE_API_URL=https://your-new-api.com
```

### Change App Title

Edit `index.html`:

```html
<title>My Chat App</title>
```

---

## Troubleshooting

### "Cannot find module"

```bash
npm install
```

### "Port 3000 already in use"

```bash
# Use different port
npm run dev -- --port 3001
```

### "WebSocket connection failed"

Check `.env` - `VITE_API_URL` must be correct

### "Login doesn't work"

1. Check Firebase credentials in `.env`
2. Check Firebase console - is web app added?
3. Check authorized JavaScript origins in Firebase

### "Messages not syncing"

1. Open browser DevTools → Console
2. Should show "Socket connected"
3. If not, check API URL and network

---

## What Each Page Does

### LoginPage
```
Google Sign-In button
├─ Redirects to Google
├─ Gets Firebase token
├─ Calls /api/me
└─ Redirects to InboxPage
```

### InboxPage
```
Conversation list
├─ Shows all conversations
├─ Search by name
├─ Online status dots
├─ Unread message counts
└─ Click to open ChatPage
```

### ChatPage
```
Main messaging interface
├─ Message history
├─ Real-time messages
├─ Typing indicators
├─ Emoji reactions
├─ Message composer
├─ Send button
└─ Back button
```

---

## Real-Time Features

### Automatic (No Code Needed)

- ✅ Messages appear instantly
- ✅ Typing indicators show
- ✅ Online/offline status updates
- ✅ Reactions sync immediately
- ✅ Read receipts update
- ✅ Cross-device sync

### What Happens Behind Scenes

```
User sends message on web
        ↓
socket.emit('send_message')
        ↓
WebSocket to backend
        ↓
Backend broadcasts to all devices
        ↓
Mobile app receives event
        ↓
Message appears on mobile instantly
        ↓
User sees message on both devices
```

---

## Deploy to Production

### Option 1: Netlify (Easiest)

```
1. Push code to GitHub
2. Connect repo to Netlify
3. Build command: npm run build
4. Publish dir: dist
5. Deploy!
```

### Option 2: Vercel

```
1. Push code to GitHub
2. Import project to Vercel
3. Auto-detects Vite
4. Deploy!
```

### Option 3: Docker

```bash
# Build Docker image
docker build -t messenger-web .

# Run container
docker run -p 80:80 messenger-web
```

### Option 4: Manual

```bash
npm run build
# Upload 'dist' folder to any web hosting
```

---

## Checklist

- [ ] `npm install` completes
- [ ] `npm run dev` starts on localhost:3000
- [ ] Web app loads in browser
- [ ] Login with Google works
- [ ] See conversation list
- [ ] Can click conversation and see messages
- [ ] Can type and send message
- [ ] Message appears on mobile app instantly
- [ ] Mobile message appears on web instantly
- [ ] Typing indicator works both ways
- [ ] Online status shows correctly

If all ✅, you're ready to use!

---

## Need Help?

1. **Docs:** See `README.md` for full documentation
2. **Setup:** See `SETUP.md` for detailed setup
3. **Architecture:** See `../ARCHITECTURE.md` for system overview
4. **Errors:** Check browser console (F12) for error messages

---

## Phone Web App

Open `http://localhost:3000` on your phone to test mobile browser version:

```
Desktop: Full layout (sidebar + chat)
Tablet:  Responsive layout
Phone:   Stacked layout (tap conversation to open chat)
```

---

**You're all set!** Start chatting across platforms! 🚀
