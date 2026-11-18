// The shape of everything the hub shows. The content itself is not kept here: `content.ts` builds
// it from the same files and tables the rest of the site reads (releases, reels, roster,
// playlists, events, the Wire), so a change there shows in the hub too.

export type Media =
  | { kind: 'reel'; loop: string; full: string; poster: string }
  | { kind: 'youtube'; id: string; poster: string }
  | { kind: 'spotify'; embed: string; poster?: string }
  | { kind: 'info'; poster?: string };

/** A link: its words and where it goes. A path starting with "/" is a page of this site. */
export type HubLink = [label: string, href: string];

export interface Card {
  id: string;
  /** Catalogue code shown on the card's label strip. */
  code: string;
  title: string;
  sub: string;
  /** Width over height. */
  aspect: number;
  media: Media;
  /** Lines for an info card's face, and for the viewer. */
  lines?: string[];
  links?: HubLink[];
}

export interface Zone {
  id: string;
  label: string;
  title: string;
  line: string;
  cards: Card[];
  /** "Go deeper": the full page for this part of the hub. */
  deeper?: HubLink;
}

export interface HubContent {
  zones: Zone[];
  /** What the home part says beside the logo. */
  whatWeDo: [string, string][];
  socials: HubLink[];
  /** The site's own pages, as its nav bar lists them. */
  pages: HubLink[];
}

/** The parts of the hub, top to bottom. Set once by `setContent` before the hub is built; the
 *  layout and the 3D world read it while they build. */
export let ZONES: Zone[] = [];
export let WHAT_WE_DO: [string, string][] = [];
export let SOCIALS: HubLink[] = [];

export function setContent(c: HubContent) {
  ZONES = c.zones;
  WHAT_WE_DO = c.whatWeDo;
  SOCIALS = c.socials;
}
