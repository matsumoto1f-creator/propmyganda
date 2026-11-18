import { describe, it, expect } from "vitest";
import { ADDONS, ADDON_CATEGORIES, fromLabel, getAddOn, priceCart } from "../../supabase/functions/_shared/addons";
import { SYSTEM_PROMPT } from "../../supabase/functions/_shared/agent";

// The ranges printed in docs/PMG-Add-Ons.pdf, "What we charge", in dollars. Every size on the page must sit inside its row.
const PDF_RANGES: Record<string, [number, number]> = {
  release: [2500, 3500], clips: [75, 900], interview: [750, 1500], live: [600, 900], photo: [600, 2000],
  visual: [250, 900], performance: [2500, 5000], concept: [7500, 15000], cover: [150, 600], brand: [400, 900],
  poster: [50, 300], merch: [250, 1000], store: [300, 500], web: [150, 1500], ads: [300, 500], pitching: [250, 500],
  pr: [1000, 2500], mix: [250, 2000],
};

describe("add-ons catalog", () => {
  it("has unique ids, a known category and one to three sizes each, cheapest first", () => {
    expect(new Set(ADDONS.map((a) => a.id)).size).toBe(ADDONS.length);
    for (const a of ADDONS) {
      expect(ADDON_CATEGORIES).toContain(a.category);
      expect(a.options.length).toBeGreaterThanOrEqual(1);
      expect(a.options.length).toBeLessThanOrEqual(3);
      expect(new Set(a.options.map((o) => o.id)).size).toBe(a.options.length);
      const prices = a.options.map((o) => o.priceCents);
      expect([...prices].sort((x, y) => x - y)).toEqual(prices);
    }
  });
  it("keeps every price inside the range the team PDF gives for that service", () => {
    for (const a of ADDONS) {
      const range = PDF_RANGES[a.id];
      expect(range, `no PDF range recorded for ${a.id}`).toBeTruthy();
      for (const o of a.options) {
        expect(o.priceCents / 100, `${a.id}/${o.id}`).toBeGreaterThanOrEqual(range[0]);
        expect(o.priceCents / 100, `${a.id}/${o.id}`).toBeLessThanOrEqual(range[1]);
      }
    }
  });
  it("labels the cheapest size", () => {
    expect(fromLabel(getAddOn("clips")!)).toBe("from $125");
    expect(fromLabel(getAddOn("poster")!)).toBe("from $60");
  });
});

describe("pricing a cart", () => {
  it("totals from the catalog and ignores any price the browser sends", () => {
    const r = priceCart([{ id: "clips", option: "4", priceCents: 1 }, { id: "cover", option: "shoot" }]);
    expect(r).toMatchObject({ totalCents: 60_000 });
    if (!("error" in r)) expect(r.lines.map((l) => [l.name, l.label, l.priceCents])).toEqual([["Short-form clips", "4 clips", 40_000], ["Cover art", "From your shoot", 20_000]]);
  });
  it("refuses an empty cart, unknown items, unknown sizes, doubles and quoted work", () => {
    expect(priceCart([])).toHaveProperty("error");
    expect(priceCart(null)).toHaveProperty("error");
    expect(priceCart([{ id: "nope", option: "1" }])).toHaveProperty("error");
    expect(priceCart([{ id: "clips", option: "99" }])).toHaveProperty("error");
    expect(priceCart([{ id: "clips", option: "1" }, { id: "clips", option: "4" }])).toHaveProperty("error");
    expect(priceCart([{ id: "performance", option: "one" }])).toHaveProperty("error");
  });
});

describe("the chat agent and add-ons", () => {
  it("quotes add-on prices from the catalog and keeps them after the booking", () => {
    expect(SYSTEM_PROMPT).toContain("propmyganda.com/start/addons");
    expect(SYSTEM_PROMPT).toContain("short-form clips from $125");
    expect(SYSTEM_PROMPT).toContain("AFTER A BOOKING");
  });
});
