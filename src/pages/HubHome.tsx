// The home page: the PMG hub, a 3D tower of screens (src/hub).
//
// What it shows comes from the same places as the rest of the site, so it stays in step with
// them: the releases, videos, reels, roster and playlists from the site's own files, and the
// next event and the latest Wire headlines live from the database (the same queries as the
// Events and Publication pages).
//
// A device that cannot run it (no WebGL 2, "reduce motion" on, or the hub failing to start)
// gets the classic home page instead, so the home page never shows a blank screen. Adding
// ?classic to the address shows the classic home on any device.
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useNavigationType } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "@/hub/hub.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import SEO from "@/components/SEO";
import { REELS } from "@/components/ReelCarousel";
import { artists } from "@/lib/data";
import { SPOTIFY_ARTIST_EMBED, pmgLogo, releases, socialLinks, videos } from "@/lib/exclusiveData";
import { PLAYLISTS } from "@/lib/spotifyCatalog";
import { BOOKING_URL, DISTRIBUTION_CATALOGUE, RECORDS, navLinks } from "@/lib/site";
import { holdSmoothScroll } from "@/lib/smoothScroll";
import { buildContent, type ContentInput, type EventRow, type Story } from "@/hub/content";
import type { HubLink } from "@/hub/data";
import { REEL_LOOPS } from "@/hub/reel-loops";
import type { HubHandle } from "@/hub/mount";

const POSITION_KEY = "pmg:hub-at";

/** Can this device run the hub? Checked before any of the hub's code is downloaded. */
function canRunHub(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).has("classic")) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

type RosterArtist = (typeof artists)[number] & { spotifyArtistId?: string; spotifyTrackId?: string };

/** Everything in the hub that comes from the site's own files. */
const STATIC: Omit<ContentInput, "events" | "stories" | "now"> = {
  releases,
  videos,
  reels: REELS,
  reelLoops: REEL_LOOPS,
  roster: RECORDS.flatMap((r) => {
    const a = artists.find((x) => x.id === r.id) as RosterArtist | undefined;
    return a
      ? [{ id: a.id, cat: r.cat, name: a.name, genre: a.genre, spotifyArtistId: a.spotifyArtistId, spotifyTrackId: a.spotifyTrackId }]
      : [];
  }),
  playlists: PLAYLISTS,
  distribution: Object.entries(DISTRIBUTION_CATALOGUE).flatMap(([id, code]): [string, string][] => {
    const a = artists.find((x) => x.id === id);
    return a ? [[code, a.name]] : [];
  }),
  catalogueEmbed: SPOTIFY_ARTIST_EMBED,
  bookingUrl: BOOKING_URL,
  socials: socialLinks.map(({ label, href }): HubLink => [label, href]),
  pages: navLinks.filter((l) => l.path !== "/").map((l): HubLink => [l.label, l.path]),
};

/** The same rows the Events page reads. */
async function fetchEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("title,event_date,status,venue,city,doors_time,ticket_url")
    .neq("status", "cancelled")
    .order("event_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

/** The newest Wire stories, by the Publication page's rule: published, and with an article or a source. */
async function fetchStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from("publications")
    .select("title,slug,category,published_at")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .or("source_url.not.is.null,body.neq.")
    .order("published_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return (data ?? []) as Story[];
}

/** Adds an email to the list, exactly as the Exclusive page does. */
async function join(email: string): Promise<boolean> {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert([{ email, source: "site", unsubscribed_at: null, is_active: true }] as never);
  // Already on the list is a yes, not a failure.
  return !error || error.code === "23505";
}

/** The hub's fixed frame. The hub's own code fills the words, the menu's parts and the 3D. */
const Frame = memo(function Frame({ staff }: { staff: HubLink }) {
  return (
    <>
      <div className="loader" aria-hidden="true">
        <img className="loader-logo" src={pmgLogo} alt="" width={325} height={167} />
        <p className="label">// Propmyganda · loading the hub</p>
        <p className="loader-num">
          <span id="loader-pct">0</span>
          <span className="pct">%</span>
        </p>
        <p className="label" id="loader-bytes">&nbsp;</p>
      </div>

      <canvas id="scene" aria-hidden="true" />
      <div className="css3d" id="css3d" />
      <div className="shade" aria-hidden="true" />

      <header className="nav" id="nav">
        <a className="logo" href="#track" aria-label="PMG, back to the top">
          <img src={pmgLogo} alt="PMG" width={325} height={167} />
        </a>
        <div className="nav-right">
          <span className="here label" id="here" aria-hidden="true">01 · Home</span>
          <Link className="staff" to={staff[1]}>{staff[0]}</Link>
          <button type="button" className="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="menu">
            Menu <span className="menu-icon" aria-hidden="true" />
          </button>
        </div>
        <nav className="menu" id="menu" aria-label="Menu" data-lenis-prevent>
          <ol className="zones" aria-label="Parts of the hub" />
          <p className="menu-head label">Pages</p>
          <ul className="pages">
            {STATIC.pages.map(([label, path]) => (
              <li key={path}>
                <Link to={path}>{label}</Link>
              </li>
            ))}
          </ul>
          <ul className="menu-social">
            {STATIC.socials.map(([label, href]) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="track" id="track">
        <div className="words" id="words" />
      </main>

      <div className="viewer" id="viewer" hidden>
        <div className="viewer-meta" id="viewer-meta" />
        <div className="viewer-ctl">
          <button type="button" id="viewer-mute" className="ctl">Mute</button>
          <button type="button" id="viewer-close" className="ctl">
            Back to the hub <span className="label">Esc</span>
          </button>
        </div>
      </div>
      <div className="now" id="now" hidden>
        <span className="now-dot" aria-hidden="true" />
        <span className="label">Now playing</span>
        <button type="button" id="now-open" className="now-title" aria-label="Open what is playing">
          <span id="now-title" />
        </button>
        <button type="button" id="now-stop" className="ctl">Stop</button>
      </div>

      <div className="lens" id="lens" aria-hidden="true">
        <div className="scan" />
        <div className="grain" />
        <div className="falloff" />
      </div>
      <div className="probe" id="probe" aria-hidden="true" />
    </>
  );
});

function Hub({ onUnavailable }: { onUnavailable: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<HubHandle | null>(null);
  const navigate = useNavigate();
  const cameBack = useNavigationType() === "POP";
  const { session } = useAuth();

  // Live from the back office: re-read when the tab is looked at again and every five minutes.
  const live = { staleTime: 60_000, refetchInterval: 5 * 60_000, refetchOnWindowFocus: true, retry: 1 } as const;
  const events = useQuery({ queryKey: ["hub-events"], queryFn: fetchEvents, ...live });
  const stories = useQuery({ queryKey: ["hub-wire"], queryFn: fetchStories, ...live });
  const content = useMemo(
    () => buildContent({ ...STATIC, events: events.data, stories: stories.data }),
    [events.data, stories.data],
  );
  const latest = useRef(content);
  latest.current = content;
  const go = useRef(navigate);
  go.current = navigate;
  const fail = useRef(onUnavailable);
  fail.current = onUnavailable;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const stop = new AbortController();
    const release = holdSmoothScroll();
    let startAt = 0;
    try {
      if (cameBack) startAt = Number(window.sessionStorage.getItem(POSITION_KEY)) || 0;
    } catch {
      /* storage blocked: start at the top */
    }
    import("@/hub/mount")
      .then(({ mountHub }) =>
        mountHub(el, {
          content: latest.current,
          root: import.meta.env.BASE_URL,
          navigate: (path) => go.current(path),
          join,
          startAt,
          signal: stop.signal,
        }),
      )
      .then((h) => {
        handle.current = h;
        // Live rows that landed while the hub was starting.
        h.update(latest.current);
      })
      .catch((err) => {
        if (stop.signal.aborted) return;
        console.warn("The hub could not start; showing the classic home.", err);
        fail.current();
      });
    return () => {
      handle.current = null;
      stop.abort();
      release();
      // The hub's page is many screens tall; the next page starts at its top, at once.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    };
    // Mounted once: new content reaches the hub through update() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remember where the visitor was, for the Back button. This has to run before the hub's tall
  // page is taken out of the document, or the browser has already pulled the scroll back.
  useLayoutEffect(
    () => () => {
      try {
        if (handle.current) window.sessionStorage.setItem(POSITION_KEY, String(handle.current.position()));
      } catch {
        /* storage blocked */
      }
    },
    [],
  );

  useEffect(() => {
    handle.current?.update(content);
  }, [content]);

  const staff = useMemo<HubLink>(
    () => (session ? ["Dashboard", "/dashboard"] : ["Staff", "/auth/login"]),
    [session],
  );

  return (
    <div className="pmg-hub" ref={host} data-mode="loading">
      <Frame staff={staff} />
    </div>
  );
}

export default function HubHome({ classic }: { classic: ReactNode }) {
  const [useClassic, setUseClassic] = useState(() => !canRunHub());
  if (useClassic) return <>{classic}</>;
  return (
    <>
      <SEO
        title="PROPMYGANDA — Independent Music & Distribution"
        description="PMG is an independent music, content and distribution company based in Brooklyn, NY. 100% independent."
        path="/"
      />
      <Hub onUnavailable={() => setUseClassic(true)} />
    </>
  );
}
