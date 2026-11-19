# Link preview image

When someone texts or posts propmyganda.com, the picture that shows is `public/og-home.jpg`, a 1200 by 630 snapshot of the homepage. It is named in `index.html` (`og:image`, `twitter:image`) and in `src/components/SEO.tsx`. Every route serves the same `index.html` to link-preview crawlers, so every page on the site shows this picture.

To retake it after the homepage changes: build the site, serve it (`npx vite preview`), open `/` in a 1200 by 630 window, wait about seven seconds for the 3D scene to settle, hide the custom cursor ring, and save a JPEG at quality 84 over `public/og-home.jpg`. If the picture should change for people who already shared the link, save it under a new file name and update the two places above: phones and apps cache previews by image address.
