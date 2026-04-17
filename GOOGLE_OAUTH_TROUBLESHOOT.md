# Google OAuth Troubleshooting

## Error: "The OAuth client was not found" (Error 401: invalid_client)

This means the Client ID `68897793071-norsbau6qm2lvlbo78286r43jtkbqdg8.apps.googleusercontent.com` is not valid.

## Solutions:

### Option 1: Create New Google OAuth Client (Recommended)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**:
   - Click project dropdown → "NEW PROJECT"
   - Name: "ShareWay" → Create
3. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Search and enable "Google+ API" or "People API"
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "ShareWay Web App"
5. **Add Authorized JavaScript origins**:
   - `http://localhost:5175`
   - `http://localhost:5173` (backup)
   - `https://share-way.vercel.app` (production)
6. **Add Authorized redirect URIs** (if needed):
   - `http://localhost:5175/auth/login`
7. **Create** → Copy the new Client ID

### Option 2: Check Existing Client ID

If you already have a Google OAuth app:

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Find your OAuth 2.0 Client ID
5. Copy the correct Client ID (it should end with `.apps.googleusercontent.com`)

### Option 3: Disable Google OAuth (Temporary)

If you want to test without Google OAuth:

**Frontend (.env):**
```env
VITE_GOOGLE_CLIENT_ID=
```

This will hide the Google Sign-In button and you can use regular login.

## Test Accounts (Always Available):

- **User**: `user@demo.com` / `demo1234`
- **Driver**: `driver@demo.com` / `demo1234`
- **Admin**: `admin@demo.com` / `demo1234`

## Next Steps:

1. Get the correct Google Client ID using Option 1 or 2
2. Update both `.env` files with the correct ID
3. Restart both servers
4. Test Google Sign-In

The error shows the Client ID you provided doesn't exist in Google's system.
