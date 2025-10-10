# 🚀 Setup Guide for Soundtrack Cinema

This guide will walk you through setting up the Soundtrack Cinema application step by step.

## Step 1: Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account (create one if you don't have it)
3. Click **"Create an App"**
4. Fill in the app details:
   - **App name**: Soundtrack Cinema (or any name you prefer)
   - **App description**: A web app to discover movies from songs
   - **Redirect URI**: `http://localhost:4200` (for development)
5. Accept the terms and click **"Create"**
6. You'll see your app dashboard with:
   - **Client ID**: Copy this value
   - **Client Secret**: Click "Show Client Secret" and copy this value

## Step 2: Get TMDb API Key

1. Go to [The Movie Database](https://www.themoviedb.org/)
2. Create an account if you don't have one
3. Go to your account settings
4. Navigate to the **API** section in the left sidebar
5. Click on **"Request an API Key"**
6. Choose **"Developer"** option
7. Fill in the application details:
   - **Application Name**: Soundtrack Cinema
   - **Application URL**: http://localhost:4200 (for development)
   - **Application Summary**: A web app to discover movies featuring songs
8. Accept the terms and submit
9. Copy your **API Key (v3 auth)**

## Step 3: Configure the Application

1. Open the project in your code editor
2. Navigate to `src/environments/environment.ts`
3. Replace the placeholder values with your actual API credentials:

```typescript
export const environment = {
  production: false,
  spotify: {
    clientId: 'paste_your_spotify_client_id_here',
    clientSecret: 'paste_your_spotify_client_secret_here',
  },
  tmdb: {
    apiKey: 'paste_your_tmdb_api_key_here',
  },
};
```

4. **IMPORTANT**: Do the same for `src/environments/environment.prod.ts` if you plan to deploy

## Step 4: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required dependencies including Angular and other packages.

## Step 5: Start the Development Server

Run the following command:

```bash
npm start
```

Or alternatively:

```bash
ng serve
```

The application will start and you should see output like:

```
** Angular Live Development Server is listening on localhost:4200 **
✔ Compiled successfully.
```

## Step 6: Open the Application

1. Open your web browser
2. Navigate to `http://localhost:4200`
3. You should see the Soundtrack Cinema homepage!

## Testing the Application

1. **Search for a song**: Try searching for "Bohemian Rhapsody"
2. **Select a song**: Click on one of the search results
3. **View movies**: You should see a list of movies related to that song

## Troubleshooting

### Issue: "Failed to search songs"

**Solution**: Check your Spotify API credentials in `environment.ts`
- Make sure Client ID and Client Secret are correct
- Ensure there are no extra spaces or quotes

### Issue: "Failed to search movies"

**Solution**: Check your TMDb API key in `environment.ts`
- Make sure the API key is correct
- Verify your TMDb account is active

### Issue: CORS errors

**Solution**: 
- Spotify and TMDb APIs should work from localhost
- If you see CORS errors, ensure you're accessing the app via `http://localhost:4200`
- For Spotify, you may need to add the redirect URI in your Spotify app settings

### Issue: No movies found

**Note**: The app searches for movies using the song name and artist. Not all songs will have direct movie matches. This is expected behavior. Try popular songs from movie soundtracks for better results.

## Security Best Practices

⚠️ **NEVER commit your API keys to version control!**

1. The `environment.ts` files should be added to `.gitignore` (already done)
2. Use environment variables for production deployments
3. Consider using a backend proxy for API calls in production

## Next Steps

- Explore the codebase in `src/app/`
- Customize the styling in `src/app/app.css`
- Add new features or modify existing ones
- Check out the main README.md for more information

## Need Help?

If you encounter any issues not covered here:
1. Check the browser console for error messages
2. Verify all API keys are correctly configured
3. Ensure you have a stable internet connection
4. Open an issue on GitHub with details about the problem

Happy coding! 🎬🎵
