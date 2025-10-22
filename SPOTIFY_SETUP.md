# Spotify OAuth Setup Instructions

## Problem: "INVALID_CLIENT: Invalid redirect URI"

This error occurs because the redirect URI used by the application is not registered in your Spotify Developer Dashboard.

## Solution

### 1. Go to Spotify Developer Dashboard
Visit: https://developer.spotify.com/dashboard

### 2. Select Your Application
Click on the application you created for this project.

### 3. Click "Edit Settings"
Find and click the "Edit Settings" button.

### 4. Add Redirect URI
In the "Redirect URIs" section, add the following URI:

```
http://localhost:4200/callback
```

**Important Notes:**
- If you're running your app on a different port, replace `4200` with your actual port number
- The URI must match EXACTLY (including the protocol `http://` and the path `/callback`)
- For production, you'll need to add your production domain (e.g., `https://yourdomain.com/callback`)

### 5. Save Changes
Click "Save" at the bottom of the settings modal.

### 6. Test the Application
1. Restart your Angular development server if it's running
2. Navigate to `http://localhost:4200`
3. Click "Login with Spotify"
4. You should now be redirected to Spotify's authorization page
5. After authorizing, you'll be redirected back to your app

## Additional Redirect URIs for Different Environments

If you deploy to different environments, add these as well:

- **Local development:** `http://localhost:4200/callback`
- **Production:** `https://your-production-domain.com/callback`
- **Staging:** `https://your-staging-domain.com/callback`

## Troubleshooting

### Still getting "Invalid redirect URI"?
- Double-check the port number matches your dev server
- Ensure there are no typos in the URI
- Make sure you clicked "Save" in the Spotify Dashboard
- Try clearing your browser cache and cookies
- Check that the Spotify Client ID in your `environment.ts` matches the dashboard

### Authentication not working?
- Verify your Spotify Client ID is correct in `src/environments/environment.ts`
- Check browser console for any error messages
- Ensure you're using a valid Spotify account
