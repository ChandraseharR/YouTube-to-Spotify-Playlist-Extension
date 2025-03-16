/******/ (() => { // webpackBootstrap
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
// Handle Spotify Authentication and API calls
let redirectUri = chrome.identity.getRedirectURL('oauth2');
const clientId = 'cd410dac6652414aaf84e8365ad9c7bb'; // Replace with your actual Spotify Client ID
const authUrl =
  'https://accounts.spotify.com/authorize?' +
  'client_id=' +
  clientId +
  '&response_type=token' +
  '&redirect_uri=' +
  encodeURIComponent(redirectUri) +
  '&scope=playlist-modify-public playlist-modify-private user-read-private';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'authenticate') {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      function (redirectURL) {
        if (chrome.runtime.lastError || !redirectURL) {
          sendResponse({ success: false, error: chrome.runtime.lastError });
          return;
        }

        // Extract access token from redirect URL
        const url = new URL(redirectURL);
        const hash = url.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');

        if (accessToken) {
          const expiryTime = Date.now() + parseInt(expiresIn) * 1000;
          chrome.storage.local.set(
            {
              spotifyToken: accessToken,
              tokenExpiry: expiryTime,
            },
            function () {
              sendResponse({ success: true });
            }
          );
        } else {
          sendResponse({ success: false, error: 'No access token received' });
        }
      }
    );
    return true; // Keep the message channel open for asynchronous response
  }

  if (request.action === 'createSpotifyPlaylist') {
    createSpotifyPlaylist(request.songs, request.playlistName)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for asynchronous response
  }
});

async function createSpotifyPlaylist(songs, name) {
  try {
    const tokenData = await new Promise((resolve) => {
      chrome.storage.local.get(['spotifyToken', 'tokenExpiry'], resolve);
    });

    if (!tokenData.spotifyToken || tokenData.tokenExpiry <= Date.now()) {
      return { success: false, error: 'Token expired. Please login again.' };
    }

    const token = tokenData.spotifyToken;

    // Get user ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user profile');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Create a new playlist
    const playlistResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          description: 'Created from YouTube playlist/mix',
          public: false,
        }),
      }
    );

    if (!playlistResponse.ok) {
      throw new Error('Failed to create playlist');
    }

    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;
    const playlistUrl = playlistData.external_urls.spotify;

    // Search for and add songs to the playlist
    let addedSongs = 0;
    let trackUris = [];

    for (const song of songs) {
      try {
        // Try to parse artist and title for better search
        const parsed = extractArtistAndTitle(song);
        const searchQuery = parsed.artist
          ? `track:${parsed.title} artist:${parsed.artist}`
          : song;

        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            searchQuery
          )}&type=track&limit=1`,
          {
            headers: {
              Authorization: 'Bearer ' + token,
            },
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.tracks.items.length > 0) {
            trackUris.push(searchData.tracks.items[0].uri);
            addedSongs++;
          } else {
            // If no results with artist parsing, try a simpler search
            if (parsed.artist) {
              const fallbackResponse = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(
                  song
                )}&type=track&limit=1`,
                {
                  headers: {
                    Authorization: 'Bearer ' + token,
                  },
                }
              );

              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                if (fallbackData.tracks.items.length > 0) {
                  trackUris.push(fallbackData.tracks.items[0].uri);
                  addedSongs++;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for song "${song}":`, error);
      }
    }

    // Add tracks to playlist (in batches of 100 as per Spotify API limits)
    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);

      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: batch,
        }),
      });
    }

    return {
      success: true,
      addedSongs: addedSongs,
      playlistUrl: playlistUrl,
    };
  } catch (error) {
    console.error('Error creating Spotify playlist:', error);
    return { success: false, error: error.message };
  }
}

function extractArtistAndTitle(fullTitle) {
  // Common patterns: "Artist - Title", "Artist: Title", "Artist "Title""
  const patterns = [
    /^(.*?)\s-\s(.*)$/, // Artist - Title
    /^(.*?):\s(.*)$/, // Artist: Title
    /^(.*?)\s"(.*)"$/, // Artist "Title"
  ];

  for (const pattern of patterns) {
    const match = fullTitle.match(pattern);
    if (match) {
      return {
        artist: match[1].trim(),
        title: match[2].trim(),
      };
    }
  }

  // No pattern matched, return the full title as-is
  return {
    artist: '',
    title: fullTitle,
  };
}

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBLHFEQUFxRDtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0EseUJBQXlCLGlEQUFpRDtBQUMxRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSw2QkFBNkIsZUFBZTtBQUM1QztBQUNBO0FBQ0EsVUFBVTtBQUNWLHlCQUF5QixtREFBbUQ7QUFDNUU7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxzQ0FBc0M7QUFDN0UsaUJBQWlCO0FBQ2pCO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQSxlQUFlO0FBQ2Y7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1AsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMENBQTBDLE9BQU87QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsY0FBYyxTQUFTLGNBQWM7QUFDMUQ7O0FBRUE7QUFDQSxpREFBaUQ7QUFDakQ7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1IsbURBQW1ELEtBQUs7QUFDeEQ7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQixzQkFBc0I7QUFDMUM7O0FBRUEsMERBQTBELFdBQVc7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVCxPQUFPO0FBQ1A7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLGFBQWE7QUFDYjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly95dC10by1zcG90aWZ5Ly4vc3JjL2JhY2tncm91bmQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gSGFuZGxlIFNwb3RpZnkgQXV0aGVudGljYXRpb24gYW5kIEFQSSBjYWxsc1xubGV0IHJlZGlyZWN0VXJpID0gY2hyb21lLmlkZW50aXR5LmdldFJlZGlyZWN0VVJMKCdvYXV0aDInKTtcbmNvbnN0IGNsaWVudElkID0gJ2NkNDEwZGFjNjY1MjQxNGFhZjg0ZTgzNjVhZDljN2JiJzsgLy8gUmVwbGFjZSB3aXRoIHlvdXIgYWN0dWFsIFNwb3RpZnkgQ2xpZW50IElEXG5jb25zdCBhdXRoVXJsID1cbiAgJ2h0dHBzOi8vYWNjb3VudHMuc3BvdGlmeS5jb20vYXV0aG9yaXplPycgK1xuICAnY2xpZW50X2lkPScgK1xuICBjbGllbnRJZCArXG4gICcmcmVzcG9uc2VfdHlwZT10b2tlbicgK1xuICAnJnJlZGlyZWN0X3VyaT0nICtcbiAgZW5jb2RlVVJJQ29tcG9uZW50KHJlZGlyZWN0VXJpKSArXG4gICcmc2NvcGU9cGxheWxpc3QtbW9kaWZ5LXB1YmxpYyBwbGF5bGlzdC1tb2RpZnktcHJpdmF0ZSB1c2VyLXJlYWQtcHJpdmF0ZSc7XG5cbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihmdW5jdGlvbiAocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcbiAgaWYgKHJlcXVlc3QuYWN0aW9uID09PSAnYXV0aGVudGljYXRlJykge1xuICAgIGNocm9tZS5pZGVudGl0eS5sYXVuY2hXZWJBdXRoRmxvdyhcbiAgICAgIHtcbiAgICAgICAgdXJsOiBhdXRoVXJsLFxuICAgICAgICBpbnRlcmFjdGl2ZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbiAocmVkaXJlY3RVUkwpIHtcbiAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvciB8fCAhcmVkaXJlY3RVUkwpIHtcbiAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGNocm9tZS5ydW50aW1lLmxhc3RFcnJvciB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHRyYWN0IGFjY2VzcyB0b2tlbiBmcm9tIHJlZGlyZWN0IFVSTFxuICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlZGlyZWN0VVJMKTtcbiAgICAgICAgY29uc3QgaGFzaCA9IHVybC5oYXNoLnN1YnN0cmluZygxKTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhoYXNoKTtcbiAgICAgICAgY29uc3QgYWNjZXNzVG9rZW4gPSBwYXJhbXMuZ2V0KCdhY2Nlc3NfdG9rZW4nKTtcbiAgICAgICAgY29uc3QgZXhwaXJlc0luID0gcGFyYW1zLmdldCgnZXhwaXJlc19pbicpO1xuXG4gICAgICAgIGlmIChhY2Nlc3NUb2tlbikge1xuICAgICAgICAgIGNvbnN0IGV4cGlyeVRpbWUgPSBEYXRlLm5vdygpICsgcGFyc2VJbnQoZXhwaXJlc0luKSAqIDEwMDA7XG4gICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcG90aWZ5VG9rZW46IGFjY2Vzc1Rva2VuLFxuICAgICAgICAgICAgICB0b2tlbkV4cGlyeTogZXhwaXJ5VGltZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY2Nlc3MgdG9rZW4gcmVjZWl2ZWQnIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICByZXR1cm4gdHJ1ZTsgLy8gS2VlcCB0aGUgbWVzc2FnZSBjaGFubmVsIG9wZW4gZm9yIGFzeW5jaHJvbm91cyByZXNwb25zZVxuICB9XG5cbiAgaWYgKHJlcXVlc3QuYWN0aW9uID09PSAnY3JlYXRlU3BvdGlmeVBsYXlsaXN0Jykge1xuICAgIGNyZWF0ZVNwb3RpZnlQbGF5bGlzdChyZXF1ZXN0LnNvbmdzLCByZXF1ZXN0LnBsYXlsaXN0TmFtZSlcbiAgICAgIC50aGVuKChyZXN1bHQpID0+IHNlbmRSZXNwb25zZShyZXN1bHQpKVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4gc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pKTtcbiAgICByZXR1cm4gdHJ1ZTsgLy8gS2VlcCB0aGUgbWVzc2FnZSBjaGFubmVsIG9wZW4gZm9yIGFzeW5jaHJvbm91cyByZXNwb25zZVxuICB9XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlU3BvdGlmeVBsYXlsaXN0KHNvbmdzLCBuYW1lKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgdG9rZW5EYXRhID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ3Nwb3RpZnlUb2tlbicsICd0b2tlbkV4cGlyeSddLCByZXNvbHZlKTtcbiAgICB9KTtcblxuICAgIGlmICghdG9rZW5EYXRhLnNwb3RpZnlUb2tlbiB8fCB0b2tlbkRhdGEudG9rZW5FeHBpcnkgPD0gRGF0ZS5ub3coKSkge1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVG9rZW4gZXhwaXJlZC4gUGxlYXNlIGxvZ2luIGFnYWluLicgfTtcbiAgICB9XG5cbiAgICBjb25zdCB0b2tlbiA9IHRva2VuRGF0YS5zcG90aWZ5VG9rZW47XG5cbiAgICAvLyBHZXQgdXNlciBJRFxuICAgIGNvbnN0IHVzZXJSZXNwb25zZSA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5zcG90aWZ5LmNvbS92MS9tZScsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rZW4sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgaWYgKCF1c2VyUmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGdldCB1c2VyIHByb2ZpbGUnKTtcbiAgICB9XG5cbiAgICBjb25zdCB1c2VyRGF0YSA9IGF3YWl0IHVzZXJSZXNwb25zZS5qc29uKCk7XG4gICAgY29uc3QgdXNlcklkID0gdXNlckRhdGEuaWQ7XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgcGxheWxpc3RcbiAgICBjb25zdCBwbGF5bGlzdFJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXG4gICAgICBgaHR0cHM6Ly9hcGkuc3BvdGlmeS5jb20vdjEvdXNlcnMvJHt1c2VySWR9L3BsYXlsaXN0c2AsXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rZW4sXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdDcmVhdGVkIGZyb20gWW91VHViZSBwbGF5bGlzdC9taXgnLFxuICAgICAgICAgIHB1YmxpYzogZmFsc2UsXG4gICAgICAgIH0pLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAoIXBsYXlsaXN0UmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwbGF5bGlzdCcpO1xuICAgIH1cblxuICAgIGNvbnN0IHBsYXlsaXN0RGF0YSA9IGF3YWl0IHBsYXlsaXN0UmVzcG9uc2UuanNvbigpO1xuICAgIGNvbnN0IHBsYXlsaXN0SWQgPSBwbGF5bGlzdERhdGEuaWQ7XG4gICAgY29uc3QgcGxheWxpc3RVcmwgPSBwbGF5bGlzdERhdGEuZXh0ZXJuYWxfdXJscy5zcG90aWZ5O1xuXG4gICAgLy8gU2VhcmNoIGZvciBhbmQgYWRkIHNvbmdzIHRvIHRoZSBwbGF5bGlzdFxuICAgIGxldCBhZGRlZFNvbmdzID0gMDtcbiAgICBsZXQgdHJhY2tVcmlzID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHNvbmcgb2Ygc29uZ3MpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFRyeSB0byBwYXJzZSBhcnRpc3QgYW5kIHRpdGxlIGZvciBiZXR0ZXIgc2VhcmNoXG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IGV4dHJhY3RBcnRpc3RBbmRUaXRsZShzb25nKTtcbiAgICAgICAgY29uc3Qgc2VhcmNoUXVlcnkgPSBwYXJzZWQuYXJ0aXN0XG4gICAgICAgICAgPyBgdHJhY2s6JHtwYXJzZWQudGl0bGV9IGFydGlzdDoke3BhcnNlZC5hcnRpc3R9YFxuICAgICAgICAgIDogc29uZztcblxuICAgICAgICBjb25zdCBzZWFyY2hSZXNwb25zZSA9IGF3YWl0IGZldGNoKFxuICAgICAgICAgIGBodHRwczovL2FwaS5zcG90aWZ5LmNvbS92MS9zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChcbiAgICAgICAgICAgIHNlYXJjaFF1ZXJ5XG4gICAgICAgICAgKX0mdHlwZT10cmFjayZsaW1pdD0xYCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva2VuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHNlYXJjaFJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgY29uc3Qgc2VhcmNoRGF0YSA9IGF3YWl0IHNlYXJjaFJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICBpZiAoc2VhcmNoRGF0YS50cmFja3MuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdHJhY2tVcmlzLnB1c2goc2VhcmNoRGF0YS50cmFja3MuaXRlbXNbMF0udXJpKTtcbiAgICAgICAgICAgIGFkZGVkU29uZ3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgbm8gcmVzdWx0cyB3aXRoIGFydGlzdCBwYXJzaW5nLCB0cnkgYSBzaW1wbGVyIHNlYXJjaFxuICAgICAgICAgICAgaWYgKHBhcnNlZC5hcnRpc3QpIHtcbiAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tSZXNwb25zZSA9IGF3YWl0IGZldGNoKFxuICAgICAgICAgICAgICAgIGBodHRwczovL2FwaS5zcG90aWZ5LmNvbS92MS9zZWFyY2g/cT0ke2VuY29kZVVSSUNvbXBvbmVudChcbiAgICAgICAgICAgICAgICAgIHNvbmdcbiAgICAgICAgICAgICAgICApfSZ0eXBlPXRyYWNrJmxpbWl0PTFgLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rZW4sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBpZiAoZmFsbGJhY2tSZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrRGF0YSA9IGF3YWl0IGZhbGxiYWNrUmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgICAgIGlmIChmYWxsYmFja0RhdGEudHJhY2tzLml0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIHRyYWNrVXJpcy5wdXNoKGZhbGxiYWNrRGF0YS50cmFja3MuaXRlbXNbMF0udXJpKTtcbiAgICAgICAgICAgICAgICAgIGFkZGVkU29uZ3MrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHNlYXJjaGluZyBmb3Igc29uZyBcIiR7c29uZ31cIjpgLCBlcnJvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWRkIHRyYWNrcyB0byBwbGF5bGlzdCAoaW4gYmF0Y2hlcyBvZiAxMDAgYXMgcGVyIFNwb3RpZnkgQVBJIGxpbWl0cylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRyYWNrVXJpcy5sZW5ndGg7IGkgKz0gMTAwKSB7XG4gICAgICBjb25zdCBiYXRjaCA9IHRyYWNrVXJpcy5zbGljZShpLCBpICsgMTAwKTtcblxuICAgICAgYXdhaXQgZmV0Y2goYGh0dHBzOi8vYXBpLnNwb3RpZnkuY29tL3YxL3BsYXlsaXN0cy8ke3BsYXlsaXN0SWR9L3RyYWNrc2AsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tlbixcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgdXJpczogYmF0Y2gsXG4gICAgICAgIH0pLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBhZGRlZFNvbmdzOiBhZGRlZFNvbmdzLFxuICAgICAgcGxheWxpc3RVcmw6IHBsYXlsaXN0VXJsLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgY3JlYXRpbmcgU3BvdGlmeSBwbGF5bGlzdDonLCBlcnJvcik7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEFydGlzdEFuZFRpdGxlKGZ1bGxUaXRsZSkge1xuICAvLyBDb21tb24gcGF0dGVybnM6IFwiQXJ0aXN0IC0gVGl0bGVcIiwgXCJBcnRpc3Q6IFRpdGxlXCIsIFwiQXJ0aXN0IFwiVGl0bGVcIlwiXG4gIGNvbnN0IHBhdHRlcm5zID0gW1xuICAgIC9eKC4qPylcXHMtXFxzKC4qKSQvLCAvLyBBcnRpc3QgLSBUaXRsZVxuICAgIC9eKC4qPyk6XFxzKC4qKSQvLCAvLyBBcnRpc3Q6IFRpdGxlXG4gICAgL14oLio/KVxcc1wiKC4qKVwiJC8sIC8vIEFydGlzdCBcIlRpdGxlXCJcbiAgXTtcblxuICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICBjb25zdCBtYXRjaCA9IGZ1bGxUaXRsZS5tYXRjaChwYXR0ZXJuKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFydGlzdDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgICB0aXRsZTogbWF0Y2hbMl0udHJpbSgpLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBObyBwYXR0ZXJuIG1hdGNoZWQsIHJldHVybiB0aGUgZnVsbCB0aXRsZSBhcy1pc1xuICByZXR1cm4ge1xuICAgIGFydGlzdDogJycsXG4gICAgdGl0bGU6IGZ1bGxUaXRsZSxcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==