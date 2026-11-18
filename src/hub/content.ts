// What the hub says, built from the same sources as the rest of the site, so one edit (or one
// change in the back office) shows in both:
//
//   Exclusive   src/lib/exclusiveData.ts        releases, videos, social links
//   Records     src/components/ReelCarousel.tsx the reels (REELS)
//   Roster      src/pages/Artists.tsx + src/lib/data.ts + src/lib/spotifyCatalog.ts
//   Events      the `events` table              (same query as the Events page)
//   Wire        the `publications` table        (same query as the Publication page)
//   Pages       src/components/Navbar.tsx       the site's own nav links
//
// `buildContent` is pure: it takes that data and returns the hub's parts. `HubHome.tsx` gathers
// the data and calls it again whenever the live part changes.
import type { Card, HubContent, HubLink, Zone } from './data';

export interface Release {
  title: string;
  artist: string;
  date: string;
  cover: string;
  links: Record<string, string>;
}
export interface Video {
  title: string;
  id: string;
}
export interface Reel {
  cat: string;
  src: string;
  poster: string;
}
export interface RosterArtist {
  id: string;
  cat: string;
  name: string;
  genre: string;
  spotifyArtistId?: string;
  spotifyTrackId?: string;
}
export interface Playlist {
  id: string;
  name: string;
}
export interface EventRow {
  title: string;
  event_date: string;
  status: string;
  venue: string | null;
  city: string | null;
  doors_time: string | null;
  ticket_url: string | null;
}
/** A Wire story. The query only returns stories with something to read (see HubHome.tsx). */
export interface Story {
  title: string;
  slug: string;
  category: string;
  published_at: string | null;
}

export interface ContentInput {
  releases: Release[];
  videos: Video[];
  reels: Reel[];
  /** Ring loops the hub has for a reel, by the reel's asset id (see reel-loops.ts). */
  reelLoops: Record<string, string>;
  roster: RosterArtist[];
  playlists: readonly Playlist[];
  /** Distribution clients, already in catalogue order: [code, name]. */
  distribution: [string, string][];
  catalogueEmbed: string;
  bookingUrl: string;
  socials: HubLink[];
  pages: HubLink[];
  /** Live rows; undefined while they are loading or if the request failed. */
  events?: EventRow[];
  stories?: Story[];
  now?: number;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function youtubeId(url: string | undefined): string | null {
  if (!url) return null;
  return (
    /[?&]v=([\w-]{6,})/.exec(url)?.[1] ??
    /youtu\.be\/([\w-]{6,})/.exec(url)?.[1] ??
    /youtube\.com\/(?:embed|shorts)\/([\w-]{6,})/.exec(url)?.[1] ??
    null
  );
}
export function spotifyTrackId(url: string | undefined): string | null {
  return url ? (/open\.spotify\.com\/track\/([A-Za-z0-9]+)/.exec(url)?.[1] ?? null) : null;
}
const spotifyEmbed = (type: 'track' | 'playlist' | 'artist', id: string) =>
  `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
/** YouTube's own still for a video; it allows use in a 3D texture (CORS is open). */
const youtubeStill = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
/** The asset id inside one of the site's hosted file URLs (/__l5e/assets-v1/<id>/<name>). */
export const assetId = (url: string) => /assets-v1\/([0-9a-f-]{36})\//.exec(url)?.[1] ?? '';

/** "Artist — Song (PMG Visualizer)" becomes the title "Artist — Song" and the line "PMG Visualizer". */
export function splitVideoTitle(title: string): [string, string] {
  const paren = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(title);
  if (paren) return [paren[1].trim(), paren[2].trim()];
  const dash = title.split(' — ');
  if (dash.length > 1) return [title.trim(), dash[dash.length - 1].trim()];
  return [title.trim(), 'PMG on camera'];
}

/** The Events page reads dates the same way, so both show the same day. */
function eventDay(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Upcoming events, soonest first: the same rule as the Events page. */
export function upcomingEvents(events: EventRow[]): EventRow[] {
  return events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
}
/** Published stories, newest first: the same rule as the Wire. */
export function liveStories(stories: Story[], now: number): Story[] {
  return stories
    .filter((s) => s.published_at && new Date(s.published_at).getTime() <= now)
    .sort(
      (a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime(),
    );
}

function eventsCard(events: EventRow[] | undefined): Card {
  const upcoming = events ? upcomingEvents(events) : [];
  const next = upcoming[0];
  const lines = next
    ? [
        `Upcoming · ${pad(upcoming.length)}`,
        clip(next.title, 34),
        [eventDay(next.event_date), next.doors_time ? `Doors ${next.doors_time}` : '']
          .filter(Boolean)
          .join(' · '),
        clip([next.venue, next.city].filter(Boolean).join(' · '), 34),
      ].filter(Boolean)
    : ['Upcoming', 'Next date: soon'];
  const links: HubLink[] = [['Events', '/events']];
  if (next?.ticket_url) links.push(['Tickets', next.ticket_url]);
  return {
    id: 'events',
    code: 'Nonstop NY · PMG-E',
    title: 'Events',
    sub: 'No skips · Brooklyn',
    aspect: 4 / 5,
    media: { kind: 'info' },
    lines: [...lines, 'Book or hire:', 'DJ · Security · Venue', 'Promoter · Artist · Bartender'],
    links,
  };
}

function wireCard(stories: Story[] | undefined, now: number): Card {
  const live = stories ? liveStories(stories, now).slice(0, 3) : [];
  const links: HubLink[] = [['Read the Wire', '/publication']];
  if (live[0]) links.push(['Top story', `/publication/${live[0].slug}`]);
  return {
    id: 'wire',
    code: 'Propmyganda · Editorial',
    title: 'PMG Wire',
    sub: 'Publication · live feed',
    aspect: 4 / 5,
    media: { kind: 'info' },
    lines: live.length
      ? live.map((s) => clip(s.title, 38))
      : ['Business · Artists · Culture', 'Milestones · Industry'],
    links,
  };
}

export function buildContent(input: ContentInput): HubContent {
  const now = input.now ?? Date.now();

  const exclusive: Card[] = input.releases.map((r, i) => {
    const yt = youtubeId(r.links.YouTube);
    const sp = spotifyTrackId(r.links.Spotify);
    return {
      id: slug(r.title) || `release-${i + 1}`,
      code: `PMG-R-${pad(i + 1, 3)} · ${r.date}`,
      title: r.title,
      sub: r.artist,
      aspect: 1,
      media: yt
        ? { kind: 'youtube', id: yt, poster: r.cover }
        : sp
          ? { kind: 'spotify', embed: spotifyEmbed('track', sp), poster: r.cover }
          : { kind: 'info', poster: r.cover },
      links: Object.entries(r.links),
    };
  });
  exclusive.push({
    id: 'catalogue',
    code: 'PMG-P-001',
    title: 'Hear it all',
    sub: 'Propmyganda · Full catalogue',
    aspect: 1,
    media: { kind: 'spotify', embed: input.catalogueEmbed },
    lines: ['Propmyganda', 'Full catalogue', 'on Spotify'],
  });

  const visuals: Card[] = input.reels.map((r, i) => ({
    id: `reel-${i + 1}`,
    code: r.cat,
    title: `PMG Visuals ${pad(i + 1)}`,
    sub: 'Records · made with the artist, in the room',
    aspect: 9 / 16,
    media: {
      kind: 'reel',
      // A reel the hub has no ring loop for (a new upload) shows its poster in the ring and
      // still plays in full when opened.
      loop: input.reelLoops[assetId(r.src)] ?? '',
      full: r.src,
      poster: r.poster,
    },
  }));

  // A roster artist's screen wears the cover of their PMG Exclusive release when there is one.
  const coverOf = (name: string) =>
    input.releases.find((r) => r.artist.toLowerCase() === name.toLowerCase())?.cover;
  const roster: Card[] = [
    ...input.roster.flatMap((a): Card[] => {
      const embed = a.spotifyArtistId
        ? spotifyEmbed('artist', a.spotifyArtistId)
        : a.spotifyTrackId
          ? spotifyEmbed('track', a.spotifyTrackId)
          : null;
      if (!embed) return [];
      const cover = coverOf(a.name);
      return [
        {
          id: a.id,
          code: `${a.cat} · ${a.genre}`,
          title: a.name,
          sub: 'Follow artist',
          aspect: 4 / 5,
          media: cover ? { kind: 'spotify', embed, poster: cover } : { kind: 'spotify', embed },
          lines: [a.name, a.genre],
        },
      ];
    }),
    ...input.playlists.map(
      (p): Card => ({
        id: `playlist-${p.id}`,
        code: `PMG-PL-${p.id.slice(0, 4).toUpperCase()}`,
        title: p.name,
        sub: 'Playlist',
        aspect: 4 / 5,
        media: { kind: 'spotify', embed: spotifyEmbed('playlist', p.id) },
        lines: ['Playlist', p.name],
      }),
    ),
    {
      id: 'open-call',
      code: 'PMG-Records · Open call',
      title: 'Got a record?',
      sub: 'Book a session',
      aspect: 4 / 5,
      media: { kind: 'info' },
      lines: ['Sessions: open', 'Video: open', 'Release: open', 'Cost: $0.00 (free)', 'Zone: Brooklyn'],
      links: [['Book a session', input.bookingUrl]],
    },
  ];

  const camera: Card[] = input.videos.map((v, i) => {
    const [title, sub] = splitVideoTitle(v.title);
    return {
      id: `video-${v.id}`,
      code: `PMG-V-${pad(i + 1, 3)}`,
      title,
      sub,
      aspect: 16 / 9,
      media: { kind: 'youtube', id: v.id, poster: youtubeStill(v.id) },
    };
  });

  const world: Card[] = [
    eventsCard(input.events),
    {
      id: 'distribution',
      code: 'Propmyganda · Distribution',
      title: 'We move music.',
      sub: 'Every major platform',
      aspect: 4 / 5,
      media: { kind: 'info' },
      lines: [
        'Transparent splits. No middlemen.',
        ...input.distribution.map(([code, name]) => `${code} ${name}`),
        '150+ platforms',
      ],
      links: [['Work with PMG', '/distribution']],
    },
    wireCard(input.stories, now),
    {
      id: 'store',
      code: 'Store · Vault closed',
      title: 'Next drop: soon',
      sub: 'No filler merch',
      aspect: 4 / 5,
      media: { kind: 'info' },
      lines: ['Items 0 · Total $0.00', "The vault is shut while we figure out what's worth printing."],
      links: [['Store', '/store']],
    },
    {
      id: 'propworld',
      code: 'The PMG world',
      title: 'PropWorld',
      sub: 'Interactive 3D',
      aspect: 4 / 5,
      media: { kind: 'info' },
      lines: ['Walk the forest.', 'Fight in the streets.', 'Fly the space run.'],
      links: [['Enter PropWorld', '/propworld']],
    },
  ];

  const youtube = input.socials.find(([label]) => label === 'YouTube')?.[1];
  const all: Zone[] = [
    {
      id: 'home',
      label: '100% Independent · Content · Distribution · Culture',
      title: 'Propmyganda',
      line: 'We move music for artists who refuse to wait for permission.',
      cards: [],
    },
    {
      id: 'exclusive',
      label: 'Brooklyn, NY · PMG Exclusive',
      title: 'Exclusive',
      line: 'A new artist every few days. Hear it first.',
      cards: exclusive,
      deeper: ['Go deeper: PMG Exclusive', '/exclusive'],
    },
    {
      id: 'visuals',
      label: '// PMG · Records · Visuals',
      title: 'Records',
      line: 'Collaborative records, live cuts and renditions. Made with the artist, in the room.',
      cards: visuals,
      deeper: ['Go deeper: Records', '/artists'],
    },
    {
      id: 'roster',
      label: '// The roster · PMG playlists',
      title: 'Roster',
      line: 'Bring the record. We build the rest.',
      cards: roster,
      deeper: ['Go deeper: the roster', '/artists'],
    },
    {
      id: 'camera',
      label: 'Performances · Sessions · Interviews',
      title: 'On camera',
      line: 'PMG visualizers and sessions.',
      cards: camera,
      deeper: youtube ? ['Go deeper: PMG on YouTube', youtube] : undefined,
    },
    {
      id: 'world',
      label: 'Events · Distribution · Wire · Store · PropWorld',
      title: 'The PMG world',
      line: 'Everything else Propmyganda runs, one door each.',
      cards: world,
    },
  ];
  // A part with nothing in it is left out of the tower (the home part has no screens by design).
  const zones = all.filter((z) => z.id === 'home' || z.cards.length > 0);

  return {
    zones,
    whatWeDo: [
      ['Distribution', 'Selective placement across every major DSP. Transparent splits. No middlemen.'],
      ['Content', 'From visuals to long-form, we build the world around the record.'],
      ['Culture', 'We invest in scenes, not just streams. Brooklyn-rooted, globally minded.'],
    ],
    socials: input.socials,
    pages: input.pages,
  };
}
