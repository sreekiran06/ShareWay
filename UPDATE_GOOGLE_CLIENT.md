# Update Google OAuth Client ID

## New Valid Client ID:
`804042741041-pg20gmaqr5b5g9qbr586lng2vigjvo6m.apps.googleusercontent.com`

## Update Instructions:

### Frontend (.env)
Add/update this line:
```env
VITE_GOOGLE_CLIENT_ID=804042741041-pg20gmaqr5b5g9qbr586lng2vigjvo6m.apps.googleusercontent.com
```

### Backend (.env)
Add/update this line:
```env
GOOGLE_CLIENT_ID=804042741041-pg20gmaqr5b5g9qbr586lng2vigjvo6m.apps.googleusercontent.com
```

## Complete .env Files:

### Frontend (.env) - Complete:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here
VITE_GOOGLE_CLIENT_ID=804042741041-pg20gmaqr5b5g9qbr586lng2vigjvo6m.apps.googleusercontent.com
```

### Backend (.env) - Add this line:
```env
GOOGLE_CLIENT_ID=804042741041-pg20gmaqr5b5g9qbr586lng2vigjvo6m.apps.googleusercontent.com
```

## After Update:
1. Save both .env files
2. Restart both servers (or wait for nodemon auto-restart)
3. Go to: http://localhost:5175/auth/login
4. Click "Continue with Google"
5. Should work without errors!

## Important:
Make sure your Google Cloud Console has these authorized origins:
- http://localhost:5175
- http://localhost:5173
