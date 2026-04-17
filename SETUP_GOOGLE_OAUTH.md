# Google OAuth Setup Instructions

## Frontend Configuration
Add this to your `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=68897793071-norsbau6qm2lvlbo78286r43jtkbqdg8.apps.googleusercontent.com
```

## Backend Configuration
Add this to your `backend/.env` file:

```env
# Google OAuth (add this line)
GOOGLE_CLIENT_ID=68897793071-norsbau6qm2lvlbo78286r43jtkbqdg8.apps.googleusercontent.com
```

## Steps to Configure:
1. Open `frontend/.env` in your editor
2. Add the Google Client ID line above
3. Open `backend/.env` in your editor  
4. Add the Google Client ID line above
5. Restart both servers:
   - Backend: `npm run dev`
   - Frontend: `npm run dev`

## Authorized Origins
Make sure your Google Cloud Console has:
- `http://localhost:5175` (current frontend port)
- `http://localhost:5173` (default port)

## Test
After configuration:
1. Go to `http://localhost:5175/auth/login`
2. Click "Continue with Google"
3. Sign in with your Google account
4. Should redirect to appropriate dashboard based on role

Your Google Client ID: `68897793071-norsbau6qm2lvlbo78286r43jtkbqdg8.apps.googleusercontent.com`
