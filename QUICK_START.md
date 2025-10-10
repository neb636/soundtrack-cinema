# ⚡ Quick Start - Soundtrack Cinema

## 🎯 Get Running in 5 Minutes

### 1. Get API Keys (2 minutes)

**Spotify**: https://developer.spotify.com/dashboard
- Create app → Copy Client ID & Client Secret

**TMDb**: https://www.themoviedb.org/settings/api
- Request API Key → Copy API Key

### 2. Configure (1 minute)

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  spotify: {
    clientId: 'YOUR_CLIENT_ID_HERE',
    clientSecret: 'YOUR_CLIENT_SECRET_HERE',
  },
  tmdb: {
    apiKey: 'YOUR_API_KEY_HERE',
  },
};
```

### 3. Install & Run (2 minutes)

```bash
npm install
npm start
```

Open http://localhost:4200

### 4. Test

Search for: **"Bohemian Rhapsody"** or **"Eye of the Tiger"**

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Failed to search songs" | Check Spotify credentials in `environment.ts` |
| "Failed to search movies" | Check TMDb API key in `environment.ts` |
| Port 4200 in use | Run `ng serve --port 4201` |
| No movies found | Try popular soundtrack songs |

---

## 📚 Full Documentation

- **Setup Guide**: See `SETUP_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **README**: See `README.md`

---

**That's it! You're ready to discover movies through music! 🎬🎵**
