# 🔧 Fix: "Socket connection error: User not registered"

## What This Error Means

```
Socket connection error: User not registered
```

This error occurs when:
1. ✅ You successfully log in with Google (Firebase authentication works)
2. ❌ But the backend doesn't have your user profile in the database

## Why It Happens

The backend requires users to be registered in the database before they can use real-time features. When you log in for the first time with Google, you don't exist in the backend database yet.

## Solution

I've updated the web app to **automatically register new users** on first login. Here's what happens:

```
1. Click "Sign in with Google"
2. Firebase authenticates you ✅
3. App calls GET /api/me to fetch your profile
4. If profile doesn't exist, app calls POST /api/me to create it
5. Socket connection succeeds ✅
```

## Steps to Fix

### Option 1: Clear Cache and Retry (Recommended)

1. **Stop the dev server:**
   ```
   Ctrl+C
   ```

2. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Or use Incognito/Private window

4. **Start dev server:**
   ```bash
   npm run dev
   ```

5. **Log in again with Google**

### Option 2: Check Browser Console

Open DevTools (F12) and check the Console tab for detailed error:

```javascript
// Good sign:
✅ Socket connected successfully

// Problem sign:
❌ Socket connection error: {
  message: "User not registered",
  data: {...}
}
```

If you see detailed error data, share it for more specific help.

### Option 3: Verify Backend is Running

The error happens if the backend API is:
- Not running
- Not accessible
- Not responding correctly

**Check:**

```bash
# Test if backend is accessible
curl https://messenger-atvk.onrender.com/api/health

# Should return 200 OK with some response
```

If backend is down:
1. Go to Render.com dashboard
2. Check your Messenger API service status
3. Deploy if needed

## What I Changed

### 1. AuthContext.jsx - Auto-User Registration
```javascript
// Now when user logs in:
1. Try to GET /api/me
2. If fails, POST /api/me with user data
3. This creates profile in database automatically
```

### 2. socketService.js - Better Error Logging
```javascript
// Now shows detailed error information:
- error.message (what went wrong)
- error.data (additional details)
- Type of disconnect (why it happened)
```

## Common Issues & Fixes

### Issue: Still Getting Same Error

**Check 1: Is backend running?**
```bash
# Test backend health
curl https://messenger-atvk.onrender.com/api/me

# Should ask for authentication, not "not found"
```

**Check 2: Is backend updated?**
If the backend is old and doesn't support POST `/api/me`, it might not create users. You may need to:
- Update the backend code
- Use a different user registration endpoint
- Contact your backend developer

**Check 3: Is Firebase configured correctly?**
Check `.env` file:
```env
VITE_FIREBASE_API_KEY=✓ should be filled
VITE_FIREBASE_PROJECT_ID=✓ should be filled
# etc
```

### Issue: Backend Doesn't Support POST /api/me

If your backend doesn't have a user creation endpoint, you'll need to either:

**A) Add one to backend:**
```javascript
// Backend should have POST /api/me
POST /api/me
Authorization: Bearer <firebase_token>
Body: { email, name, photoURL }
Response: { id, email, name, ... }
```

**B) Use mobile app first:**
Register on the mobile app first, then web app will recognize you.

**C) Request help:**
Contact your backend developer to add user auto-creation on first socket connection.

## Step-by-Step Verification

1. **Check browser console (F12)**
   - Do you see "Socket connected" or "connection error"?

2. **Check network tab**
   - Is GET `/api/me` returning 200 or 401/404?
   - Is there a POST `/api/me` request?

3. **Check backend logs**
   - Are there errors when you try to log in?

4. **Test with curl:**
   ```bash
   # Get Firebase token first (complex)
   # Then test backend:
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://messenger-atvk.onrender.com/api/me
   ```

## Still Not Working?

Try these steps in order:

1. ✅ Restart dev server (`npm run dev`)
2. ✅ Clear browser cache (Ctrl+Shift+Delete)
3. ✅ Check browser console (F12) for exact error
4. ✅ Verify `.env` has correct Firebase credentials
5. ✅ Test backend is accessible: `curl BACKEND_URL/api/health`
6. ✅ Try with mobile app - register there first
7. ✅ Check backend logs for what's failing

## Understanding the Full Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Web App Login Flow                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. User clicks "Sign in with Google"                       │
│    ↓                                                        │
│ 2. Firebase handles OAuth popup                            │
│    ↓                                                        │
│ 3. Firebase returns ID token                               │
│    ↓                                                        │
│ 4. AuthContext calls GET /api/me                           │
│    ├─ ✅ User exists → Use existing profile               │
│    └─ ❌ User doesn't exist → Try POST /api/me             │
│    ↓                                                        │
│ 5. Backend creates user in database                        │
│    ↓                                                        │
│ 6. SocketContext connects WebSocket                        │
│    ├─ ✅ Auth succeeds → Socket connected                │
│    └─ ❌ Auth fails → "User not registered" error         │
│    ↓                                                        │
│ 7. User can chat in real-time                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Getting Help

If you still have issues:

1. **Check console tab (F12)** and copy the exact error message
2. **Check network tab** and see what API calls are being made
3. **Check that backend is running** (hit `/api/health` endpoint)
4. **Verify Firebase config** in `.env` file is correct
5. **Try the mobile app** - does it work there?

## Reference

- **Error source:** Browser Console (F12)
- **Fix applied:** AuthContext auto-registration + better logging
- **Backend requirement:** Support for POST `/api/me` to create users
- **Time to fix:** Usually 5-10 minutes

---

Let me know if this fixes it or if you need more help! 🚀
