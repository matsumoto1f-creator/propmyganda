# The hub (the home page)

The home page is a 3D tower of screens: the PMG logo on top, then one ring per part of the site
(Exclusive, Records, Roster, On camera, The PMG world), then the sign-up. Scrolling flies down
through it. Tapping a screen opens it full size and plays it; going back keeps it playing.

Every other page of the site is unchanged. The hub links to all of them (the menu lists the nav's
pages, each part has a "Go deeper" link, and Staff sign-in is top right).

## Where its content comes from

Nothing in the hub is typed in twice. `content.ts` builds it from the sources the pages use:

| In the hub | Source | Change it by |
| --- | --- | --- |
| Exclusive releases, On camera videos, social links | `src/lib/exclusiveData.ts` | editing that file |
| Records reels | `REELS` in `src/components/ReelCarousel.tsx` | editing that list |
| Roster, booking link, distribution codes, nav pages | `src/lib/site.ts`, `src/lib/data.ts` | editing those files |
| Playlists | `PLAYLISTS` in `src/lib/spotifyCatalog.ts` | editing that list |
| Roster and playlist covers and names | Spotify, read live in the browser | nothing: it follows Spotify |
| Events screen (next show, tickets) | the `events` table | the back office |
| Wire screen (three newest headlines) | the `publications` table | the back office (and the news scraper) |
| Sign-up form | inserts into `newsletter_subscribers` | the same row the Exclusive page writes |

The two live tables are read with the same rules as the Events and Publication pages, when the
page opens, every five minutes, and whenever the tab is looked at again. No reload is needed.

A new release, video, reel or playlist gets its own screen the next time the site is built.

### A new or replaced reel

The rings play short loops (`public/hub/reels/N-loop.mp4`, 360x640, 8 seconds) so the home page
does not download the 33 MB originals; the original plays when a reel is opened. Loops are matched
to reels by asset id in `reel-loops.ts`. A reel without a loop still works: its poster shows in the
ring. To add a loop, cut one (the command is in `reel-loops.ts`) and add a line there.

## Devices that cannot run it

No WebGL 2, "reduce motion" switched on, or the hub failing to start: the visitor gets the classic
home page (`src/pages/Index.tsx`) instead. `/?classic` shows the classic home on any device.

## How it is put together

- `src/pages/HubHome.tsx` renders the hub's frame, gathers the content and mounts the hub.
- `mount.ts` runs it: scroll, words, viewer, teardown. `world.ts` is the 3D scene, `layout.ts`
  the tower and camera path, `glitch.ts` the title effect, `kinetic.ts` the picture column,
  `earth.ts` the live Earth behind it.
- It is loaded on demand, so it adds nothing to other pages. PropWorld is loaded on demand too.
- **Styles are fenced.** Every rule in `hub.css` starts with `.pmg-hub` (or `html.pmg-hub-on`,
  set only while the hub is on screen). A test fails if one does not, because this stylesheet
  ships in the site's main CSS file.
- **Two versions of three.js.** The hub uses three r187, installed as `three-hub`. PropWorld and
  PMG Fight keep the site's three r160. Do not point the hub at `three`. The few three.js add-ons
  the hub needs are copied into `three-addons/` for the same reason (see its README).
- **The Earth** is Earthlight by Max Vyshniakov (MIT), in `vendor/earthlight`, reached through
  the `earthlight-backdrop` alias in `vite.config.ts`. Its scene data streams from the author's
  host. If that is unreachable, or the device draws in software, the still picture in
  `public/hub/earth` stays. Licence and data credits: `public/licenses/earthlight`, and the
  credit line at the bottom of the hub.

## Checks

```
npm test                         # includes src/test/hub.test.ts
npm run build
node scripts/hub-check.mjs       # the hub in a real browser, phone and desktop
node scripts/hub-check.mjs --gpu # the same on this machine's GPU, with the live Earth
node scripts/hub-check.mjs --serve 8797   # no checks: serve the built site to look at
```

The checks answer sign-ups themselves, so they never write to the real database. `--serve` is the
real site talking to the real database: an email typed into it is saved for real.
