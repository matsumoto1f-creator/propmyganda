// The add-ons menu: one page, each service with two or three sizes, priced in the open.
// Sizes and prices sit inside the ranges in docs/PMG-Add-Ons.pdf ("What we charge"), in the same
// order and groups. Offered only after a booking is complete; never inside the booking steps.
// Change a price here and the page, the checkout, the emails and the chat agent all follow.

export type AddOnCategory = "Bundle" | "Content" | "Video" | "Design" | "Merch" | "Web" | "Ads" | "Audio";

export interface AddOnOption { id: string; label: string; priceCents: number; detail: string }
export interface AddOn {
  id: string; category: AddOnCategory; name: string; line: string; options: AddOnOption[];
  /** Custom work: the sizes are a guide and the team quotes it. Cannot be bought on the page. */
  quoteOnly?: boolean;
  featured?: boolean;
}

export const ADDON_CATEGORIES: AddOnCategory[] = ["Bundle", "Content", "Video", "Design", "Merch", "Web", "Ads", "Audio"];

export const ADDONS: AddOn[] = [
  {
    id: "release", category: "Bundle", featured: true, name: "Release Package",
    line: "Everything a release needs, in one order. Built from what your shoot already produced.",
    options: [
      { id: "standard", label: "Standard", priceCents: 250_000, detail: "Cover art, visualizer, 6 clips, smart link and pre-save, $500 managed ad spend, playlist pitching" },
      { id: "plus", label: "Plus", priceCents: 350_000, detail: "Everything in Standard, with 12 clips and $1,000 managed ad spend" },
    ],
  },
  {
    id: "clips", category: "Content", name: "Short-form clips",
    line: "Cut from your shoot footage for TikTok, Reels and Shorts.",
    options: [
      { id: "1", label: "1 clip", priceCents: 12_500, detail: "One cut, captioned" },
      { id: "4", label: "4 clips", priceCents: 40_000, detail: "$100 a clip" },
      { id: "8", label: "8 clips", priceCents: 70_000, detail: "A month of posts, under $90 a clip" },
    ],
  },
  {
    id: "interview", category: "Content", name: "Filmed interview",
    line: "A sit-down in the room, edited, with clips to post.",
    options: [
      { id: "30", label: "30 minutes", priceCents: 75_000, detail: "2 cameras, edited, 3 clips" },
      { id: "45", label: "45 minutes", priceCents: 110_000, detail: "3 cameras, edited, 3 clips" },
      { id: "45plus", label: "45 minutes + 6 clips", priceCents: 150_000, detail: "3 cameras, edited, 6 clips" },
    ],
  },
  {
    id: "live", category: "Content", name: "Live session",
    line: "Performed live in the room, multi-camera.",
    options: [
      { id: "1", label: "1 song", priceCents: 60_000, detail: "Multi-cam, mixed and edited" },
      { id: "2", label: "2 songs", priceCents: 90_000, detail: "Same session, two cuts" },
    ],
  },
  {
    id: "photo", category: "Content", name: "Photoshoot",
    line: "Press shots, cover and socials.",
    options: [
      { id: "half", label: "Half day", priceCents: 80_000, detail: "15 retouched photos" },
      { id: "full", label: "Full day", priceCents: 160_000, detail: "30 retouched photos, two looks" },
    ],
  },
  {
    id: "visual", category: "Video", name: "Visualizer or lyric video",
    line: "For the DSP release, YouTube and the stories.",
    options: [
      { id: "visualizer", label: "Visualizer", priceCents: 30_000, detail: "Looped visual for the full track" },
      { id: "lyric", label: "Lyric video", priceCents: 40_000, detail: "Timed lyrics, full track" },
      { id: "both", label: "Both", priceCents: 60_000, detail: "Visualizer and lyric video" },
    ],
  },
  {
    id: "performance", category: "Video", name: "Performance video", quoteOnly: true,
    line: "A full performance video, shot and edited. Quoted to the idea.",
    options: [
      { id: "one", label: "One location", priceCents: 250_000, detail: "Half-day shoot, one look" },
      { id: "looks", label: "One location, two looks", priceCents: 350_000, detail: "Full-day shoot" },
      { id: "two", label: "Two locations", priceCents: 500_000, detail: "Full day, company move" },
    ],
  },
  {
    id: "concept", category: "Video", name: "Concept video", quoteOnly: true,
    line: "Story, cast, locations. Quoted to the treatment.",
    options: [
      { id: "from", label: "Starts at", priceCents: 750_000, detail: "Up to $15,000 depending on the treatment" },
    ],
  },
  {
    id: "cover", category: "Design", name: "Cover art",
    line: "Single or album cover, sized for every DSP.",
    options: [
      { id: "shoot", label: "From your shoot", priceCents: 20_000, detail: "One cover from the shoot stills" },
      { id: "alternates", label: "From your shoot + 2 alternates", priceCents: 35_000, detail: "Three covers to choose from" },
      { id: "illustrated", label: "Illustrated", priceCents: 45_000, detail: "Drawn to your direction" },
    ],
  },
  {
    id: "brand", category: "Design", name: "Logo and brand kit",
    line: "So every post, cover and flyer looks like you.",
    options: [
      { id: "logo", label: "Logo", priceCents: 40_000, detail: "Logo in every format" },
      { id: "kit", label: "Logo + colours + type", priceCents: 65_000, detail: "The basics of a brand" },
      { id: "full", label: "Full mini kit", priceCents: 90_000, detail: "Logo, colours, type and social templates" },
    ],
  },
  {
    id: "poster", category: "Design", name: "Poster or Spotify Canvas",
    line: "For the show, the tour or the track page.",
    options: [
      { id: "canvas", label: "Spotify Canvas", priceCents: 6_000, detail: "The looping visual on your track" },
      { id: "poster", label: "Poster", priceCents: 20_000, detail: "Print-ready" },
      { id: "sized", label: "Poster + social sizes", priceCents: 30_000, detail: "Print-ready, plus every feed and story size" },
    ],
  },
  {
    id: "merch", category: "Merch", name: "Merch",
    line: "Designed, printed, in your hands.",
    options: [
      { id: "design", label: "Design only", priceCents: 30_000, detail: "Print-ready artwork" },
      { id: "24", label: "Design + 24 shirts", priceCents: 59_000, detail: "One colour, blanks included" },
      { id: "50", label: "Design + 50 shirts", priceCents: 75_000, detail: "One colour, blanks included, $9 a shirt" },
    ],
  },
  {
    id: "store", category: "Merch", name: "Merch store",
    line: "A print-on-demand store that ships for you.",
    options: [
      { id: "setup", label: "Store setup", priceCents: 40_000, detail: "Built and connected; platform fees are billed to you at cost" },
    ],
  },
  {
    id: "web", category: "Web", name: "Smart link, EPK or website",
    line: "One place to send people.",
    options: [
      { id: "link", label: "Smart link + pre-save", priceCents: 20_000, detail: "Every DSP on one link" },
      { id: "epk", label: "EPK page", priceCents: 40_000, detail: "Bio, photos, music, contacts" },
      { id: "site", label: "Website", priceCents: 110_000, detail: "Your own site, built and launched" },
    ],
  },
  {
    id: "ads", category: "Ads", name: "Ad management",
    line: "We run the campaign. Ad spend is billed at cost, never marked up; this is the fee.",
    options: [
      { id: "1000", label: "Up to $1,000 in ad spend", priceCents: 30_000, detail: "One campaign, with the report" },
      { id: "2000", label: "Up to $2,000 in ad spend", priceCents: 50_000, detail: "One campaign, with the report" },
    ],
  },
  {
    id: "pitching", category: "Ads", name: "Playlist pitching",
    line: "Pitched to curators on SubmitHub, Groover and Playlist Push.",
    options: [
      { id: "starter", label: "Starter", priceCents: 25_000, detail: "Fee and pitch credits included" },
      { id: "standard", label: "Standard", priceCents: 37_500, detail: "More curators, fee and credits included" },
      { id: "push", label: "Push", priceCents: 50_000, detail: "The widest run, fee and credits included" },
    ],
  },
  {
    id: "pr", category: "Ads", name: "Press", quoteOnly: true,
    line: "A press run for the release. Quoted to the outlets you want.",
    options: [
      { id: "from", label: "Starts at", priceCents: 100_000, detail: "Up to $2,500 for a full starter campaign" },
    ],
  },
  {
    id: "mix", category: "Audio", name: "Mix and master",
    line: "Before the shoot, if the record is not finished.",
    options: [
      { id: "1", label: "1 song", priceCents: 32_500, detail: "Mixed and mastered" },
      { id: "3", label: "3 songs", priceCents: 90_000, detail: "$300 a song" },
      { id: "5", label: "5 songs", priceCents: 140_000, detail: "$280 a song" },
    ],
  },
];

export function getAddOn(id: string): AddOn | undefined {
  return ADDONS.find((a) => a.id === id);
}

const usd = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 });

/** "from $125", for a teaser, an email line or the chat agent. */
export function fromLabel(a: AddOn): string {
  return `from ${usd(Math.min(...a.options.map((o) => o.priceCents)))}`;
}

export interface CartItem { id: string; option: string }
export interface CartLine { id: string; option: string; name: string; label: string; detail: string; priceCents: number }

/**
 * Prices a cart from the catalog, never from what the browser sends.
 * One size per add-on; unknown ids, unknown sizes and quote-only work are refused.
 */
export function priceCart(items: unknown): { lines: CartLine[]; totalCents: number } | { error: string } {
  if (!Array.isArray(items) || items.length === 0) return { error: "Pick at least one add-on" };
  if (items.length > ADDONS.length) return { error: "Too many items" };
  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const raw of items) {
    const it = (raw ?? {}) as Partial<CartItem>;
    const a = typeof it.id === "string" ? getAddOn(it.id) : undefined;
    if (!a) return { error: "That add-on is not on the menu" };
    if (a.quoteOnly) return { error: `${a.name} is quoted, not bought here` };
    if (seen.has(a.id)) return { error: `${a.name} is in the order twice` };
    const o = a.options.find((x) => x.id === it.option);
    if (!o) return { error: `Pick a size for ${a.name}` };
    seen.add(a.id);
    lines.push({ id: a.id, option: o.id, name: a.name, label: o.label, detail: o.detail, priceCents: o.priceCents });
  }
  return { lines, totalCents: lines.reduce((s, l) => s + l.priceCents, 0) };
}
