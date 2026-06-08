/* assets/video-click-handler.js
   Save this as a new file in your theme's assets folder.
   It replaces the inline <script> block from theme.liquid. */

(function () {
  'use strict';

  const init = (videoMedia) => {
    if (videoMedia.dataset.mobileClickInit) return;
    videoMedia.dataset.mobileClickInit = '1';

    const video = videoMedia.querySelector('video');
    if (!video) return;

    const showBtn = () => videoMedia.setAttribute('show-play-button', '');
    const hideBtn = () => videoMedia.removeAttribute('show-play-button');

    video.addEventListener('play', hideBtn);
    video.addEventListener('pause', showBtn);
    video.addEventListener('ended', showBtn);

    videoMedia.addEventListener('click', (e) => {
      if (window.innerWidth > 999) return;

      const rect = video.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      if (video.controls && clickY > rect.height - 40) return;

      e.preventDefault();
      e.stopPropagation();

      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, true);
  };

  const scan = () => {
    document.querySelectorAll('video-media[type="video"]:not([data-mobile-click-init])').forEach(init);
  };

  // Run when DOM is ready (defer attr means we're already past DOMContentLoaded usually)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    scan();
  }

  // Scoped observer: only watch for video-media additions, not every DOM mutation.
  // Throttled with requestAnimationFrame to batch work.
  let pending = false;
  const observer = new MutationObserver((mutations) => {
    if (pending) return;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && (node.tagName === 'VIDEO-MEDIA' || (node.querySelector && node.querySelector('video-media')))) {
          pending = true;
          requestAnimationFrame(() => { scan(); pending = false; });
          return;
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
