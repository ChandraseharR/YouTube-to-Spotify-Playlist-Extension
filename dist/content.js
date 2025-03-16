/******/ (() => { // webpackBootstrap
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
// content.js
function getYouTubeSongs(forcedType = 'mix') {
  const url = window.location.href;
  const songs = [];

  // Autodetect content type if not specified
  let contentType = forcedType;
  // Get songs based on content type
  // YouTube Mix extraction
  if (window.location.hostname === 'music.youtube.com') {
    // YouTube Music
    const autoplayItems = Array.from(
      document.querySelectorAll('ytmusic-player-queue-item')
    );
    autoplayItems.forEach((item) => {
      const titleElement = item.querySelector('.song-title');
      if (titleElement) {
        songs.push(cleanupSongTitle(titleElement.textContent.trim()));
      }
    });
  } else {
    // Regular YouTube
    // Current playing video
    const currentVideoTitle = document.querySelector(
      '.ytd-watch-metadata #title h1'
    );
    if (currentVideoTitle) {
      songs.push(cleanupSongTitle(currentVideoTitle.textContent.trim()));
    }

    // Videos in the mix/autoplay queue
    const mixItems = document.querySelectorAll(
      'style-scope ytd-playlist-panel-renderer'
    );
    mixItems.forEach((item) => {
      const titleElement = item.querySelector('#video-title');
      if (titleElement) {
        songs.push(cleanupSongTitle(titleElement.textContent.trim()));
      }
    });

    // Alternative selector for mix items
    if (songs.length <= 1) {
      const altMixItems = document.querySelectorAll(
        'ytd-playlist-panel-video-renderer'
      );
      altMixItems.forEach((item) => {
        const titleElement = item.querySelector('#video-title');
        if (titleElement) {
          songs.push(cleanupSongTitle(titleElement.textContent.trim()));
        }
      });
    }
    // Focus only on the sidebar playlist panel
    // const sidebarMixItems = document.querySelectorAll(
    //   'ytd-playlist-panel-renderer'
    // );
    // sidebarMixItems.forEach((item) => {
    //   const titleElement = item.querySelector('#video-title');
    //   if (titleElement) {
    //     songs.push(cleanupSongTitle(titleElement.textContent.trim()));
    //   }
    // });
  }

  // Remove duplicates
  const uniqueSongs = [...new Set(songs)];

  return uniqueSongs;
}

function cleanupSongTitle(title) {
  // Remove common YouTube-specific parts from titles
  let cleanTitle = title
    .replace(/\(Official Video\)/gi, '')
    .replace(/\[Official Video\]/gi, '')
    .replace(/\(Official Music Video\)/gi, '')
    .replace(/\(Official Audio\)/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\(Lyrics\)/gi, '')
    .replace(/\[Lyrics\]/gi, '')
    .replace(/\(Lyric Video\)/gi, '')
    .replace(/\(HD\)/gi, '')
    .replace(/\(HQ\)/gi, '')
    .replace(/\d{4} Remaster/gi, '')
    .replace(/\bft\.|\bfeat\./gi, '') // Common featuring identifiers
    .replace(/\s+/g, ' ') // Remove extra spaces
    .trim();

  return cleanTitle;
}

// Add artist detection for better Spotify matching
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getYouTubeSongs') {
    const songs = getYouTubeSongs(request.type);
    sendResponse({ songs: songs });
  }
  return true; // Keep the message channel open for asynchronous response
});

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixHQUFHO0FBQ3BCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsY0FBYztBQUNqQztBQUNBLGVBQWU7QUFDZixDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8veXQtdG8tc3BvdGlmeS8uL3NyYy9jb250ZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGNvbnRlbnQuanNcbmZ1bmN0aW9uIGdldFlvdVR1YmVTb25ncyhmb3JjZWRUeXBlID0gJ21peCcpIHtcbiAgY29uc3QgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gIGNvbnN0IHNvbmdzID0gW107XG5cbiAgLy8gQXV0b2RldGVjdCBjb250ZW50IHR5cGUgaWYgbm90IHNwZWNpZmllZFxuICBsZXQgY29udGVudFR5cGUgPSBmb3JjZWRUeXBlO1xuICAvLyBHZXQgc29uZ3MgYmFzZWQgb24gY29udGVudCB0eXBlXG4gIC8vIFlvdVR1YmUgTWl4IGV4dHJhY3Rpb25cbiAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ211c2ljLnlvdXR1YmUuY29tJykge1xuICAgIC8vIFlvdVR1YmUgTXVzaWNcbiAgICBjb25zdCBhdXRvcGxheUl0ZW1zID0gQXJyYXkuZnJvbShcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3l0bXVzaWMtcGxheWVyLXF1ZXVlLWl0ZW0nKVxuICAgICk7XG4gICAgYXV0b3BsYXlJdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5zb25nLXRpdGxlJyk7XG4gICAgICBpZiAodGl0bGVFbGVtZW50KSB7XG4gICAgICAgIHNvbmdzLnB1c2goY2xlYW51cFNvbmdUaXRsZSh0aXRsZUVsZW1lbnQudGV4dENvbnRlbnQudHJpbSgpKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gUmVndWxhciBZb3VUdWJlXG4gICAgLy8gQ3VycmVudCBwbGF5aW5nIHZpZGVvXG4gICAgY29uc3QgY3VycmVudFZpZGVvVGl0bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgJy55dGQtd2F0Y2gtbWV0YWRhdGEgI3RpdGxlIGgxJ1xuICAgICk7XG4gICAgaWYgKGN1cnJlbnRWaWRlb1RpdGxlKSB7XG4gICAgICBzb25ncy5wdXNoKGNsZWFudXBTb25nVGl0bGUoY3VycmVudFZpZGVvVGl0bGUudGV4dENvbnRlbnQudHJpbSgpKSk7XG4gICAgfVxuXG4gICAgLy8gVmlkZW9zIGluIHRoZSBtaXgvYXV0b3BsYXkgcXVldWVcbiAgICBjb25zdCBtaXhJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgICAnc3R5bGUtc2NvcGUgeXRkLXBsYXlsaXN0LXBhbmVsLXJlbmRlcmVyJ1xuICAgICk7XG4gICAgbWl4SXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgY29uc3QgdGl0bGVFbGVtZW50ID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcjdmlkZW8tdGl0bGUnKTtcbiAgICAgIGlmICh0aXRsZUVsZW1lbnQpIHtcbiAgICAgICAgc29uZ3MucHVzaChjbGVhbnVwU29uZ1RpdGxlKHRpdGxlRWxlbWVudC50ZXh0Q29udGVudC50cmltKCkpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFsdGVybmF0aXZlIHNlbGVjdG9yIGZvciBtaXggaXRlbXNcbiAgICBpZiAoc29uZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgIGNvbnN0IGFsdE1peEl0ZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgICAgJ3l0ZC1wbGF5bGlzdC1wYW5lbC12aWRlby1yZW5kZXJlcidcbiAgICAgICk7XG4gICAgICBhbHRNaXhJdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IHRpdGxlRWxlbWVudCA9IGl0ZW0ucXVlcnlTZWxlY3RvcignI3ZpZGVvLXRpdGxlJyk7XG4gICAgICAgIGlmICh0aXRsZUVsZW1lbnQpIHtcbiAgICAgICAgICBzb25ncy5wdXNoKGNsZWFudXBTb25nVGl0bGUodGl0bGVFbGVtZW50LnRleHRDb250ZW50LnRyaW0oKSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8gRm9jdXMgb25seSBvbiB0aGUgc2lkZWJhciBwbGF5bGlzdCBwYW5lbFxuICAgIC8vIGNvbnN0IHNpZGViYXJNaXhJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgLy8gICAneXRkLXBsYXlsaXN0LXBhbmVsLXJlbmRlcmVyJ1xuICAgIC8vICk7XG4gICAgLy8gc2lkZWJhck1peEl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAvLyAgIGNvbnN0IHRpdGxlRWxlbWVudCA9IGl0ZW0ucXVlcnlTZWxlY3RvcignI3ZpZGVvLXRpdGxlJyk7XG4gICAgLy8gICBpZiAodGl0bGVFbGVtZW50KSB7XG4gICAgLy8gICAgIHNvbmdzLnB1c2goY2xlYW51cFNvbmdUaXRsZSh0aXRsZUVsZW1lbnQudGV4dENvbnRlbnQudHJpbSgpKSk7XG4gICAgLy8gICB9XG4gICAgLy8gfSk7XG4gIH1cblxuICAvLyBSZW1vdmUgZHVwbGljYXRlc1xuICBjb25zdCB1bmlxdWVTb25ncyA9IFsuLi5uZXcgU2V0KHNvbmdzKV07XG5cbiAgcmV0dXJuIHVuaXF1ZVNvbmdzO1xufVxuXG5mdW5jdGlvbiBjbGVhbnVwU29uZ1RpdGxlKHRpdGxlKSB7XG4gIC8vIFJlbW92ZSBjb21tb24gWW91VHViZS1zcGVjaWZpYyBwYXJ0cyBmcm9tIHRpdGxlc1xuICBsZXQgY2xlYW5UaXRsZSA9IHRpdGxlXG4gICAgLnJlcGxhY2UoL1xcKE9mZmljaWFsIFZpZGVvXFwpL2dpLCAnJylcbiAgICAucmVwbGFjZSgvXFxbT2ZmaWNpYWwgVmlkZW9cXF0vZ2ksICcnKVxuICAgIC5yZXBsYWNlKC9cXChPZmZpY2lhbCBNdXNpYyBWaWRlb1xcKS9naSwgJycpXG4gICAgLnJlcGxhY2UoL1xcKE9mZmljaWFsIEF1ZGlvXFwpL2dpLCAnJylcbiAgICAucmVwbGFjZSgvXFwoQXVkaW9cXCkvZ2ksICcnKVxuICAgIC5yZXBsYWNlKC9cXChMeXJpY3NcXCkvZ2ksICcnKVxuICAgIC5yZXBsYWNlKC9cXFtMeXJpY3NcXF0vZ2ksICcnKVxuICAgIC5yZXBsYWNlKC9cXChMeXJpYyBWaWRlb1xcKS9naSwgJycpXG4gICAgLnJlcGxhY2UoL1xcKEhEXFwpL2dpLCAnJylcbiAgICAucmVwbGFjZSgvXFwoSFFcXCkvZ2ksICcnKVxuICAgIC5yZXBsYWNlKC9cXGR7NH0gUmVtYXN0ZXIvZ2ksICcnKVxuICAgIC5yZXBsYWNlKC9cXGJmdFxcLnxcXGJmZWF0XFwuL2dpLCAnJykgLy8gQ29tbW9uIGZlYXR1cmluZyBpZGVudGlmaWVyc1xuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJykgLy8gUmVtb3ZlIGV4dHJhIHNwYWNlc1xuICAgIC50cmltKCk7XG5cbiAgcmV0dXJuIGNsZWFuVGl0bGU7XG59XG5cbi8vIEFkZCBhcnRpc3QgZGV0ZWN0aW9uIGZvciBiZXR0ZXIgU3BvdGlmeSBtYXRjaGluZ1xuZnVuY3Rpb24gZXh0cmFjdEFydGlzdEFuZFRpdGxlKGZ1bGxUaXRsZSkge1xuICAvLyBDb21tb24gcGF0dGVybnM6IFwiQXJ0aXN0IC0gVGl0bGVcIiwgXCJBcnRpc3Q6IFRpdGxlXCIsIFwiQXJ0aXN0IFwiVGl0bGVcIlwiXG4gIGNvbnN0IHBhdHRlcm5zID0gW1xuICAgIC9eKC4qPylcXHMtXFxzKC4qKSQvLCAvLyBBcnRpc3QgLSBUaXRsZVxuICAgIC9eKC4qPyk6XFxzKC4qKSQvLCAvLyBBcnRpc3Q6IFRpdGxlXG4gICAgL14oLio/KVxcc1wiKC4qKVwiJC8sIC8vIEFydGlzdCBcIlRpdGxlXCJcbiAgXTtcblxuICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICBjb25zdCBtYXRjaCA9IGZ1bGxUaXRsZS5tYXRjaChwYXR0ZXJuKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFydGlzdDogbWF0Y2hbMV0udHJpbSgpLFxuICAgICAgICB0aXRsZTogbWF0Y2hbMl0udHJpbSgpLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBObyBwYXR0ZXJuIG1hdGNoZWQsIHJldHVybiB0aGUgZnVsbCB0aXRsZSBhcy1pc1xuICByZXR1cm4ge1xuICAgIGFydGlzdDogJycsXG4gICAgdGl0bGU6IGZ1bGxUaXRsZSxcbiAgfTtcbn1cblxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGZ1bmN0aW9uIChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuICBpZiAocmVxdWVzdC5hY3Rpb24gPT09ICdnZXRZb3VUdWJlU29uZ3MnKSB7XG4gICAgY29uc3Qgc29uZ3MgPSBnZXRZb3VUdWJlU29uZ3MocmVxdWVzdC50eXBlKTtcbiAgICBzZW5kUmVzcG9uc2UoeyBzb25nczogc29uZ3MgfSk7XG4gIH1cbiAgcmV0dXJuIHRydWU7IC8vIEtlZXAgdGhlIG1lc3NhZ2UgY2hhbm5lbCBvcGVuIGZvciBhc3luY2hyb25vdXMgcmVzcG9uc2Vcbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9