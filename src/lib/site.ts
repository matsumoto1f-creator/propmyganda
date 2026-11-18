// Facts the home page hub shares with the pages that own them: the nav, the Records roster and
// the distribution catalogue. Change one here and the page and the hub both follow.

/** The site's pages, in nav order. */
export const navLinks = [
  { label: "Home",         path: "/" },
  { label: "Records",      path: "/artists" },
  { label: "Events",       path: "/events" },
  { label: "Exclusive",    path: "/exclusive" },
  { label: "Distribution", path: "/distribution" },
  { label: "Publication",  path: "/publication" },
  { label: "Store",        path: "/store" },
  { label: "Propworld",    path: "/propworld" },
  { label: "Contact",      path: "/contact" },
];

/** Where "Got a record?" and "Book a session" lead. */
export const BOOKING_URL = "/start";

// PMG Records roster — artists we release with (not distribution clients).
export const RECORDS = [
  { id: "jahballa", cat: "PMG-R-001", tone: "navy" },
  { id: "hammad", cat: "PMG-R-002", tone: "sage" },
  { id: "stockz", cat: "PMG-R-003", tone: "ember" },
  { id: "zoe", cat: "PMG-R-004", tone: "plum" },
] as const;

/** Distribution clients and their catalogue codes. */
export const DISTRIBUTION_CATALOGUE: Record<string, string> = {
  chuckiee: "PMG-D-001",
  "mercy-porter": "PMG-D-002",
};
