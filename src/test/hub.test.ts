import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  assetId,
  buildContent,
  liveStories,
  splitVideoTitle,
  spotifyTrackId,
  upcomingEvents,
  wireStories,
  youtubeId,
  type ContentInput,
  type EventRow,
  type Story,
  type WireRow,
} from "@/hub/content";
import { REEL_LOOPS } from "@/hub/reel-loops";
import { REELS } from "@/components/ReelCarousel";
import { releases, videos } from "@/lib/exclusiveData";

const NOW = Date.parse("2026-11-18T16:00:00Z");

const base: ContentInput = {
  releases: [
    {
      title: "Pride",
      artist: "Jahballa",
      date: "Sep 17",
      cover: "/assets/pride.jpg",
      links: {
        Spotify: "https://open.spotify.com/track/2I8KpG4z6IfzBZb2wcrDmr",
        YouTube: "https://www.youtube.com/watch?v=5_y7rHkk3kY",
      },
    },
    { title: "No Video Yet", artist: "Someone", date: "Dec 1", cover: "/assets/x.jpg", links: { Spotify: "https://open.spotify.com/track/abc123" } },
  ],
  videos: [
    { title: "JORJIANA — RICH FINALLY (PMG Visualizer)", id: "ySVEwStt0CE" },
    { title: "Bally Baby — PMG Show & Tell", id: "tK3G6_bP5yw" },
  ],
  reels: [
    { cat: "PMG-V-001", src: "/__l5e/assets-v1/cbdd980c-5a46-4bf4-847e-4d4565a2aec8/pmg-reel-1.mp4", poster: "/p1.jpg" },
    { cat: "PMG-V-007", src: "/__l5e/assets-v1/00000000-0000-4000-8000-000000000000/new.mp4", poster: "/p7.jpg" },
  ],
  reelLoops: REEL_LOOPS,
  roster: [
    { id: "jahballa", cat: "PMG-R-001", name: "Jahballa", genre: "Hip-Hop", spotifyTrackId: "2I8KpG4z6IfzBZb2wcrDmr" },
    { id: "zoe", cat: "PMG-R-004", name: "Zoe", genre: "R&B / Pop", spotifyArtistId: "2ssMAH1zhNUAwxBNvESHnA", spotifyTrackId: "6nrX" },
    { id: "no-spotify", cat: "PMG-R-009", name: "Quiet", genre: "Hip-Hop" },
  ],
  playlists: [{ id: "3MyhqNLVwBKGmphHdNa5Rc", name: "Pressure" }],
  distribution: [["PMG-D-001", "Chuckiee"]],
  catalogueEmbed: "https://open.spotify.com/embed/artist/2p1eP8MWD2IANiWjFVr7NV",
  bookingUrl: "/start",
  socials: [["YouTube", "https://youtube.com/@propmyganda"]],
  pages: [["Records", "/artists"]],
  now: NOW,
};

const zone = (c: ReturnType<typeof buildContent>, id: string) => c.zones.find((z) => z.id === id)!;
const card = (c: ReturnType<typeof buildContent>, id: string) => c.zones.flatMap((z) => z.cards).find((x) => x.id === id)!;

describe("hub content: built from the site's own data", () => {
  it("stacks the parts in order and gives each full page a way in", () => {
    const c = buildContent(base);
    expect(c.zones.map((z) => z.id)).toEqual(["home", "exclusive", "visuals", "roster", "camera", "world"]);
    expect(zone(c, "exclusive").deeper).toEqual(["Go deeper: PMG Exclusive", "/exclusive"]);
    expect(zone(c, "visuals").deeper?.[1]).toBe("/artists");
    expect(zone(c, "camera").deeper?.[1]).toBe("https://youtube.com/@propmyganda");
  });

  it("turns each release into a screen that plays its video, with every platform link", () => {
    const c = buildContent(base);
    const pride = card(c, "pride");
    expect(pride.code).toBe("PMG-R-001 · Sep 17");
    expect(pride.sub).toBe("Jahballa");
    expect(pride.media).toEqual({ kind: "youtube", id: "5_y7rHkk3kY", poster: "/assets/pride.jpg" });
    expect(pride.links).toEqual(Object.entries(base.releases[0].links));
    // A release with no video yet plays from Spotify instead of leaving a dead screen.
    expect(card(c, "no-video-yet").media).toMatchObject({ kind: "spotify" });
    expect(zone(c, "exclusive").cards.at(-1)?.id).toBe("catalogue");
  });

  it("uses a ring loop only for a reel it has one for", () => {
    const c = buildContent(base);
    expect(card(c, "reel-1").media).toMatchObject({ kind: "reel", loop: "hub/reels/1-loop.mp4", full: base.reels[0].src });
    // A newly uploaded reel: poster in the ring, full video when opened.
    expect(card(c, "reel-2").media).toMatchObject({ kind: "reel", loop: "", full: base.reels[1].src, poster: "/p7.jpg" });
  });

  it("lists the roster, then the playlists, then the open call to the booking flow", () => {
    const ids = zone(buildContent(base), "roster").cards.map((x) => x.id);
    expect(ids).toEqual(["jahballa", "zoe", "playlist-3MyhqNLVwBKGmphHdNa5Rc", "open-call"]);
    const c = buildContent(base);
    expect(card(c, "jahballa").media).toMatchObject({ kind: "spotify", poster: "/assets/pride.jpg" });
    expect((card(c, "zoe").media as { embed: string }).embed).toContain("/embed/artist/2ssMAH1zhNUAwxBNvESHnA");
    expect(card(c, "open-call").links).toEqual([["Book a session", "/start"]]);
  });

  it("splits a video's title from its series", () => {
    expect(splitVideoTitle("JORJIANA — RICH FINALLY (PMG Visualizer)")).toEqual(["JORJIANA — RICH FINALLY", "PMG Visualizer"]);
    expect(splitVideoTitle("Bally Baby — PMG Show & Tell")).toEqual(["Bally Baby — PMG Show & Tell", "PMG Show & Tell"]);
    expect(splitVideoTitle("One word")).toEqual(["One word", "PMG on camera"]);
  });

  it("leaves a part out of the tower when it has nothing in it", () => {
    const c = buildContent({ ...base, videos: [], reels: [] });
    expect(c.zones.map((z) => z.id)).toEqual(["home", "exclusive", "roster", "world"]);
  });
});

describe("hub content: live from the back office", () => {
  const ev = (over: Partial<EventRow>): EventRow => ({
    title: "Nonstop NY", event_date: "2026-12-06T22:00:00Z", status: "upcoming", venue: "Elsewhere", city: "Brooklyn", doors_time: "10PM", ticket_url: null, ...over,
  });

  it("says what the Events page says when nothing is booked", () => {
    for (const events of [undefined, [], [ev({ status: "past" })]]) {
      const c = buildContent({ ...base, events });
      expect(card(c, "events").lines?.slice(0, 2)).toEqual(["Upcoming", "Next date: soon"]);
      expect(card(c, "events").links).toEqual([["Events", "/events"]]);
    }
  });

  it("shows the next upcoming event, soonest first, with its ticket link", () => {
    const events = [
      ev({ title: "Later show", event_date: "2027-01-10T22:00:00Z" }),
      ev({ title: "First show", ticket_url: "https://tickets.example/first" }),
      ev({ title: "Old show", status: "past", event_date: "2026-01-01T22:00:00Z" }),
    ];
    expect(upcomingEvents(events).map((e) => e.title)).toEqual(["First show", "Later show"]);
    const lines = card(buildContent({ ...base, events }), "events").lines ?? [];
    expect(lines[0]).toBe("Upcoming · 02");
    expect(lines[1]).toBe("First show");
    expect(lines[2]).toMatch(/Dec \d+ · Doors 10PM$/);
    expect(lines[3]).toBe("Elsewhere · Brooklyn");
    expect(card(buildContent({ ...base, events }), "events").links).toContainEqual(["Tickets", "https://tickets.example/first"]);
  });

  it("puts the three newest published Wire stories on the Wire screen", () => {
    const story = (title: string, at: string | null): Story => ({ title, slug: title.toLowerCase().replace(/ /g, "-"), category: "Artists", published_at: at });
    const stories = [
      story("Second", "2026-11-18T14:00:00Z"),
      story("Scheduled for tomorrow", "2026-11-19T14:00:00Z"),
      story("First", "2026-11-18T15:00:00Z"),
      story("Draft", null),
      story("Third", "2026-11-17T15:00:00Z"),
      story("Fourth", "2026-11-16T15:00:00Z"),
    ];
    expect(liveStories(stories, NOW).map((s) => s.title)).toEqual(["First", "Second", "Third", "Fourth"]);
    const wire = card(buildContent({ ...base, stories }), "wire");
    expect(wire.lines).toEqual(["First", "Second", "Third"]);
    expect(wire.links).toEqual([["Read the Wire", "/publication"], ["Top story", "/publication/first"]]);
  });

  it("leads the Wire screen with the story that leads the Publication page", () => {
    const row = (title: string, at: string, more: Partial<WireRow> = {}): WireRow => ({ title, slug: title.toLowerCase().replace(/ /g, "-"), category: "Artists", published_at: at, ...more });
    const hasPicture = (url: string | null) => Boolean(url);
    const newest = [row("Newest", "2026-11-18T15:00:00Z"), row("Second", "2026-11-18T14:00:00Z", { cover_url: "https://img.example/2.jpg" }), row("Third", "2026-11-17T15:00:00Z")];
    const featured = row("Featured last week", "2026-11-11T15:00:00Z", { featured: true });
    const wireOf = (stories: Story[]) => card(buildContent({ ...base, stories }), "wire");

    // A story staff marked "Feature" leads, even when it is older than the newest ones.
    let wire = wireOf(wireStories(newest, featured, hasPicture));
    expect(wire.lines).toEqual(["Featured last week", "Newest", "Second"]);
    expect(wire.links).toContainEqual(["Top story", "/publication/featured-last-week"]);

    // No featured story: the newest one with a picture leads, as on the Publication page.
    wire = wireOf(wireStories(newest, undefined, hasPicture));
    expect(wire.lines).toEqual(["Second", "Newest", "Third"]);
    expect(wire.links).toContainEqual(["Top story", "/publication/second"]);

    // No pictures at all: the newest leads.
    wire = wireOf(wireStories(newest, undefined, () => false));
    expect(wire.lines).toEqual(["Newest", "Second", "Third"]);

    // A featured story that is already among the newest is not listed twice.
    wire = wireOf(wireStories(newest, { ...newest[2], featured: true }, hasPicture));
    expect(wire.lines).toEqual(["Third", "Newest", "Second"]);
    expect(wireStories([], undefined, hasPicture)).toEqual([]);
  });

  it("keeps the Wire screen readable while the stories load", () => {
    expect(card(buildContent(base), "wire").lines?.length).toBeGreaterThan(0);
  });
});

describe("hub content: reading links", () => {
  it("finds video and track ids", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=5_y7rHkk3kY")).toBe("5_y7rHkk3kY");
    expect(youtubeId("https://youtu.be/5_y7rHkk3kY")).toBe("5_y7rHkk3kY");
    expect(youtubeId(undefined)).toBeNull();
    expect(spotifyTrackId("https://open.spotify.com/track/2I8KpG4z6IfzBZb2wcrDmr")).toBe("2I8KpG4z6IfzBZb2wcrDmr");
    expect(assetId("/__l5e/assets-v1/cbdd980c-5a46-4bf4-847e-4d4565a2aec8/pmg-reel-1.mp4")).toBe("cbdd980c-5a46-4bf4-847e-4d4565a2aec8");
  });
});

describe("hub: wired to what the site ships today", () => {
  const c = buildContent({ ...base, releases, videos, reels: REELS });

  it("has a screen for every release, video and reel on the site", () => {
    expect(zone(c, "exclusive").cards.length).toBe(releases.length + 1);
    expect(zone(c, "camera").cards.map((x) => (x.media as { id: string }).id)).toEqual(videos.map((v) => v.id));
    expect(zone(c, "visuals").cards.length).toBe(REELS.length);
    const ids = c.zones.flatMap((z) => z.cards).map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a ring loop on disk for every reel on the site", () => {
    for (const r of REELS) {
      const loop = REEL_LOOPS[assetId(r.src)];
      expect(loop, `no ring loop for ${r.cat}`).toBeTruthy();
      expect(existsSync(path.resolve("public", loop))).toBe(true);
    }
  });
});

describe("hub styles: fenced inside the hub", () => {
  // The hub's stylesheet ships in the site's main CSS file, so a loose selector would restyle
  // every other page. Every rule must start inside .pmg-hub (or html.pmg-hub-on, set only
  // while the hub is on screen).
  it("has no selector that could reach another page", () => {
    const css = readFileSync(path.resolve("src/hub/hub.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const loose: string[] = [];
    let depth = 0;
    let inKeyframes = false;
    let buffer = "";
    for (const ch of css) {
      if (ch === "{") {
        const prelude = buffer.trim();
        buffer = "";
        if (prelude.startsWith("@keyframes")) {
          inKeyframes = true;
          expect(prelude).toMatch(/^@keyframes pmg-hub-/);
        } else if (!prelude.startsWith("@") && !inKeyframes) {
          for (const sel of prelude.split(",").map((s) => s.trim())) {
            if (!/^(\.pmg-hub\b|html\.pmg-hub-on\b)/.test(sel)) loose.push(sel);
          }
        }
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
        buffer = "";
        if (depth === 0) inKeyframes = false;
      } else if (ch === ";") buffer = "";
      else buffer += ch;
    }
    expect(loose).toEqual([]);
  });
});
