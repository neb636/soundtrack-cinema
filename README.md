# 🎬 Soundtrack Cinema

**Discover movies featuring your favorite songs**

Soundtrack Cinema is a modern web application that bridges the gap between music and cinema. Search for your favorite songs on Spotify and discover movies that feature them in their soundtracks.

![Angular](https://img.shields.io/badge/Angular-20.3-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🎵 **Spotify Integration**: Search for songs using the Spotify API with real-time results
- 🎬 **Movie Discovery**: Find movies featuring your selected songs using TMDb API
- 🎨 **Modern UI**: Clean, responsive design with smooth animations
- 📱 **Mobile Friendly**: Fully responsive layout that works on all devices
- ⚡ **Fast & Efficient**: Built with Angular 20 and modern web technologies

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Spotify Developer Account
- TMDb API Account

### API Keys Setup

1. **Spotify API**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Copy your Client ID and Client Secret

2. **TMDb API**:
   - Go to [TMDb Settings](https://www.themoviedb.org/settings/api)
   - Request an API key
   - Copy your API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd movie-recommendations
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API keys:
   - Open `src/environments/environment.ts`
   - Replace the placeholder values with your actual API keys:

```typescript
export const environment = {
  production: false,
  spotify: {
    clientId: 'YOUR_SPOTIFY_CLIENT_ID',
    clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET',
  },
  tmdb: {
    apiKey: 'YOUR_TMDB_API_KEY',
  },
};
```

4. Start the development server:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:4200`

## 🎯 How to Use

1. **Search for a Song**: Enter a song name in the search bar
2. **Select a Song**: Click on a song from the search results
3. **Discover Movies**: View movies that feature the selected song in their soundtrack
4. **Explore**: Click on different songs to discover more movies

## 🏗️ Project Structure

```
src/
├── app/
│   ├── services/
│   │   ├── spotify.service.ts    # Spotify API integration
│   │   └── tmdb.service.ts       # TMDb API integration
│   ├── app.ts                    # Main app component
│   └── app.css                   # App styles
├── environments/
│   ├── environment.ts            # Development environment config
│   └── environment.prod.ts       # Production environment config
└── styles.css                    # Global styles
```

## 🛠️ Technologies Used

- **Angular 20**: Modern web framework
- **TypeScript**: Type-safe JavaScript
- **Spotify Web API**: Music data and search
- **TMDb API**: Movie database and information
- **CSS3**: Modern styling with animations

## 📝 API Documentation

### Spotify Service

- `searchTracks(query: string)`: Search for tracks on Spotify
- `getTrack(trackId: string)`: Get detailed track information

### TMDb Service

- `searchMovies(query: string)`: Search for movies by keyword
- `getMovieDetails(movieId: number)`: Get detailed movie information
- `searchMoviesBySongAndArtist(songName, artistName)`: Enhanced search combining song and artist

## 🎨 Customization

You can customize the app's appearance by modifying:
- `src/app/app.css`: Component-specific styles
- `src/styles.css`: Global styles
- Color scheme in the CSS gradient backgrounds

## 🚧 Future Enhancements

- [ ] Add user authentication
- [ ] Save favorite songs and movies
- [ ] Create playlists based on movie soundtracks
- [ ] Add movie trailers and previews
- [ ] Implement advanced filtering options
- [ ] Add social sharing features

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

**Made with ❤️ using Angular, Spotify API, and TMDb API**
