/******/ (() => { // webpackBootstrap
/*!**********************!*\
  !*** ./src/popup.js ***!
  \**********************/
document.addEventListener('DOMContentLoaded', function () {
  const loginButton = document.getElementById('login-button');
  const convertButton = document.getElementById('convert-button');
  const authSection = document.getElementById('auth-section');
  const convertSection = document.getElementById('convert-section');
  const statusDiv = document.getElementById('status');

  // Check if user is already authenticated
  chrome.storage.local.get(['spotifyToken', 'tokenExpiry'], function (result) {
    if (result.spotifyToken && result.tokenExpiry > Date.now()) {
      authSection.classList.add('hidden');
      convertSection.classList.remove('hidden');
    }
  });

  // Handle login
  loginButton.addEventListener('click', function () {
    chrome.runtime.sendMessage({ action: 'authenticate' }, function (response) {
      if (response && response.success) {
        authSection.classList.add('hidden');
        convertSection.classList.remove('hidden');
      } else {
        statusDiv.textContent = 'Authentication failed. Please try again.';
      }
    });
  });

  // Handle conversion
  convertButton.addEventListener('click', function () {
    const playlistName =
      document.getElementById('playlist-name').value || 'YouTube Playlist';
    const playlistType = 'mix';

    statusDiv.textContent = 'Scanning YouTube content...';

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: 'getYouTubeSongs',
          type: playlistType,
        },
        function (response) {
          if (response && response.songs && response.songs.length > 0) {
            statusDiv.textContent = `Found ${response.songs.length} songs. Creating Spotify playlist...`;

            chrome.runtime.sendMessage(
              {
                action: 'createSpotifyPlaylist',
                songs: response.songs,
                playlistName: playlistName,
              },
              function (result) {
                if (result.success) {
                  statusDiv.innerHTML = `Playlist created successfully!<br>
                Added ${result.addedSongs} of ${response.songs.length} songs.<br>
                <a href="${result.playlistUrl}" target="_blank">Open in Spotify</a>`;
                } else {
                  statusDiv.textContent =
                    'Failed to create playlist: ' + result.error;
                }
              }
            );
          } else {
            statusDiv.textContent = 'No songs found or failed to scan content.';
          }
        }
      );
    });
  });
});

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQSxpQ0FBaUMsd0JBQXdCO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0EsS0FBSztBQUNMLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSx3QkFBd0IsbUNBQW1DO0FBQzNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLDZDQUE2Qyx1QkFBdUI7O0FBRXBFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlO0FBQ2Y7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLG1CQUFtQixLQUFLLHVCQUF1QjtBQUN2RSwyQkFBMkIsbUJBQW1CO0FBQzlDLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLEdBQUc7QUFDSCxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8veXQtdG8tc3BvdGlmeS8uL3NyYy9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xuICBjb25zdCBsb2dpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dpbi1idXR0b24nKTtcbiAgY29uc3QgY29udmVydEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb252ZXJ0LWJ1dHRvbicpO1xuICBjb25zdCBhdXRoU2VjdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRoLXNlY3Rpb24nKTtcbiAgY29uc3QgY29udmVydFNlY3Rpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udmVydC1zZWN0aW9uJyk7XG4gIGNvbnN0IHN0YXR1c0RpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0dXMnKTtcblxuICAvLyBDaGVjayBpZiB1c2VyIGlzIGFscmVhZHkgYXV0aGVudGljYXRlZFxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydzcG90aWZ5VG9rZW4nLCAndG9rZW5FeHBpcnknXSwgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgIGlmIChyZXN1bHQuc3BvdGlmeVRva2VuICYmIHJlc3VsdC50b2tlbkV4cGlyeSA+IERhdGUubm93KCkpIHtcbiAgICAgIGF1dGhTZWN0aW9uLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICAgICAgY29udmVydFNlY3Rpb24uY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgfVxuICB9KTtcblxuICAvLyBIYW5kbGUgbG9naW5cbiAgbG9naW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBhY3Rpb246ICdhdXRoZW50aWNhdGUnIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgYXV0aFNlY3Rpb24uY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4gICAgICAgIGNvbnZlcnRTZWN0aW9uLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdHVzRGl2LnRleHRDb250ZW50ID0gJ0F1dGhlbnRpY2F0aW9uIGZhaWxlZC4gUGxlYXNlIHRyeSBhZ2Fpbi4nO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICAvLyBIYW5kbGUgY29udmVyc2lvblxuICBjb252ZXJ0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHBsYXlsaXN0TmFtZSA9XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxheWxpc3QtbmFtZScpLnZhbHVlIHx8ICdZb3VUdWJlIFBsYXlsaXN0JztcbiAgICBjb25zdCBwbGF5bGlzdFR5cGUgPSAnbWl4JztcblxuICAgIHN0YXR1c0Rpdi50ZXh0Q29udGVudCA9ICdTY2FubmluZyBZb3VUdWJlIGNvbnRlbnQuLi4nO1xuXG4gICAgY2hyb21lLnRhYnMucXVlcnkoeyBhY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWUgfSwgZnVuY3Rpb24gKHRhYnMpIHtcbiAgICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKFxuICAgICAgICB0YWJzWzBdLmlkLFxuICAgICAgICB7XG4gICAgICAgICAgYWN0aW9uOiAnZ2V0WW91VHViZVNvbmdzJyxcbiAgICAgICAgICB0eXBlOiBwbGF5bGlzdFR5cGUsXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5zb25ncyAmJiByZXNwb25zZS5zb25ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzdGF0dXNEaXYudGV4dENvbnRlbnQgPSBgRm91bmQgJHtyZXNwb25zZS5zb25ncy5sZW5ndGh9IHNvbmdzLiBDcmVhdGluZyBTcG90aWZ5IHBsYXlsaXN0Li4uYDtcblxuICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdjcmVhdGVTcG90aWZ5UGxheWxpc3QnLFxuICAgICAgICAgICAgICAgIHNvbmdzOiByZXNwb25zZS5zb25ncyxcbiAgICAgICAgICAgICAgICBwbGF5bGlzdE5hbWU6IHBsYXlsaXN0TmFtZSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgc3RhdHVzRGl2LmlubmVySFRNTCA9IGBQbGF5bGlzdCBjcmVhdGVkIHN1Y2Nlc3NmdWxseSE8YnI+XG4gICAgICAgICAgICAgICAgQWRkZWQgJHtyZXN1bHQuYWRkZWRTb25nc30gb2YgJHtyZXNwb25zZS5zb25ncy5sZW5ndGh9IHNvbmdzLjxicj5cbiAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHtyZXN1bHQucGxheWxpc3RVcmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCI+T3BlbiBpbiBTcG90aWZ5PC9hPmA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1c0Rpdi50ZXh0Q29udGVudCA9XG4gICAgICAgICAgICAgICAgICAgICdGYWlsZWQgdG8gY3JlYXRlIHBsYXlsaXN0OiAnICsgcmVzdWx0LmVycm9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdHVzRGl2LnRleHRDb250ZW50ID0gJ05vIHNvbmdzIGZvdW5kIG9yIGZhaWxlZCB0byBzY2FuIGNvbnRlbnQuJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=