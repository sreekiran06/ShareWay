# OAuth Architecture Analysis

## Current Implementation: Google OAuth2Client (No Callback URLs)

This application uses **Google OAuth2Client** directly, NOT Passport.js. This means:

### **No Callback URLs Required**
- Backend: `new OAuth2Client(process.env.GOOGLE_CLIENT_ID)`
- Frontend: Google Sign-In button with direct token handling
- Flow: Frontend gets Google token directly, sends to backend `/api/auth/google`

### **Current OAuth Flow:**
1. **Frontend:** Google Sign-In button renders
2. **User:** Clicks button, authenticates with Google
3. **Google:** Returns JWT token directly to frontend
4. **Frontend:** Sends token to backend `/api/auth/google`
5. **Backend:** Verifies token using `client.verifyIdToken()`
6. **Backend:** Creates user session, returns auth tokens

### **Code Evidence:**

**Backend (authController.js):**
```javascript
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// No callbackURL - uses direct token verification
const ticket = await client.verifyIdToken({
  idToken: credential,
  audience: process.env.GOOGLE_CLIENT_ID
});
```

**Frontend (LoginPage.jsx):**
```javascript
// Google button flow - no redirect/callback
google.accounts.id.renderButton(
  document.getElementById('google-signin-btn'),
  { theme: 'outline', size: 'large', width: 320 }
);
```

**Routes (auth.js):**
```javascript
router.post('/google', googleAuth);  // POST endpoint, not callback
```

### **What You Need in Google Cloud Console:**

**Authorized JavaScript Origins:**
```
http://localhost:5173
http://localhost:5174
http://localhost:5175
```

**Authorized Redirect URIs:**
```
NOT REQUIRED - This app uses button flow, not redirect flow
```

### **The Issue:**
The `origin_mismatch` error is because `http://localhost:5173` is NOT in your "Authorized JavaScript origins" in Google Cloud Console.

### **Solution:**
1. Go to https://console.cloud.google.com/
2. APIs & Services -> Credentials
3. Edit your OAuth Client ID
4. Add `http://localhost:5173` to "Authorized JavaScript origins"
5. Save (takes 2-5 minutes to propagate)

**No callback URLs needed!**
