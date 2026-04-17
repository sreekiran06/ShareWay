# Google OAuth Origin Mismatch Fix

## Error: "origin_mismatch" (Error 400)

This means `http://localhost:5173` is not registered in your Google Cloud Console.

## Quick Fix Steps:

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Select Your Project
- Click project dropdown at top
- Select the project where you created the OAuth Client ID

### 3. Navigate to Credentials
- Go to "APIs & Services" (left menu)
- Click "Credentials"

### 4. Edit Your OAuth Client ID
- Find your OAuth 2.0 Client ID: `804042741041-pg20gmaqr5b5g9qbr586lng2vigjvo6m.apps.googleusercontent.com`
- Click the edit icon (pencil) on the right

### 5. Add Authorized JavaScript Origins
Add these URLs to "Authorized JavaScript origins":
```
http://localhost:5173
http://localhost:5174
http://localhost:5175
https://localhost:5173
https://localhost:5174
https://localhost:5175
```

### 6. Save Changes
- Click "Save" at the bottom
- Wait a few minutes for changes to propagate

### 7. Test Again
1. Go to: http://localhost:5173/auth/login
2. Click "Continue with Google"
3. Should work now!

## Alternative: Use Demo Accounts
While fixing Google OAuth, you can use:
- User: user@demo.com / demo1234
- Driver: driver@demo.com / demo1234
- Admin: admin@demo.com / demo1234

## Important Notes:
- Changes can take 2-5 minutes to propagate
- Make sure all localhost ports are added
- You can also add your production URL if needed

The error is purely a configuration issue in Google Cloud Console.
