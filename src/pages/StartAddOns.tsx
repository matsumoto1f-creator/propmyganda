import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { ADDONS, ADDON_CATEGORIES, fromLabel, priceCart, type AddOn, type CartItem } from "@/lib/addons";
import { AFFIRM_MIN_CENTS, AFFIRM_MAX_CENTS, formatUsd, monthlyEstimateCents } from "@/lib/tiers";
import { api, type Order } from "@/lib/onboarding";
import { Button, ErrorLine, Input, Note, StepNav, Textarea } from "@/components/start/ui";

// The add-ons menu, on one page: every service with its sizes and prices in the open, one running
// total pinned to the bottom, one checkout. Reached from the done page, the prep page and the
// confirmation email, after a booking. Never linked from the booking steps or the site nav.

const CONTACT_EMAIL = "workwithpmg@gmail.com";
const CART_KEY = "pmg-addons";

function loadCart(): Record<string, string> {
  try { return JSON.parse(sessionStorage.getItem(CART_KEY) ?? "{}") as Record<string, string>; } catch { return {}; }
}

function OptionCard({ label, detail, price, picked, onPick, disabled }: { label: string; detail: string; price: string; picked?: boolean; onPick?: () => void; disabled?: boolean }) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="text-[16px] font-bold leading-6">{label}</span>
        <span className="shrink-0 font-poster text-[24px] leading-none">{price}</span>
      </span>
      <span className={`mt-1 block text-[14px] leading-[22px] ${picked ? "text-ink/75" : "text-ash"}`}>{detail}</span>
      {picked && <span className="mt-2 block text-[12px] font-bold uppercase tracking-[0.14em] text-blood">✓ In your order · tap to remove</span>}
    </>
  );
  if (disabled) return <div className="border border-rule px-4 py-3.5 text-bone">{body}</div>;
  return (
    <button type="button" aria-pressed={!!picked} onClick={onPick} className={`min-h-[72px] border px-4 py-3.5 text-left transition-colors ${picked ? "border-bone bg-bone text-ink" : "border-edge text-bone hover:border-bone"}`}>
      {body}
    </button>
  );
}

function AddOnBlock({ a, picked, onPick, orderRef }: { a: AddOn; picked?: string; onPick: (option: string) => void; orderRef?: string | null }) {
  const cols = a.options.length >= 3 ? "sm:grid-cols-3" : a.options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2";
  return (
    <article className={`border-t-[3px] pt-4 ${a.featured ? "border-blood" : "border-bone"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[20px] font-bold leading-7 text-bone">{a.name}</h3>
        <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-blood-hi">{a.quoteOnly ? `Quoted · ${fromLabel(a)}` : fromLabel(a)}</span>
      </div>
      <p className="mt-1 max-w-2xl text-[15px] leading-6 text-smoke">{a.line}</p>
      <div className={`mt-4 grid gap-3 ${cols}`}>
        {a.options.map((o) => (
          <OptionCard key={o.id} label={o.label} detail={o.detail} price={formatUsd(o.priceCents)} picked={picked === o.id} onPick={() => onPick(o.id)} disabled={a.quoteOnly} />
        ))}
      </div>
      {a.quoteOnly && (
        <p className="mt-3 text-[14px] leading-6 text-ash">
          This one is built to the idea, so we quote it. <a className="font-bold text-bone underline decoration-blood decoration-2 underline-offset-4 hover:text-blood-hi" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Quote · ${a.name}${orderRef ? ` · ${orderRef}` : ""}`)}`}>Ask for a quote</a>.
        </p>
      )}
    </article>
  );
}

export default function StartAddOns() {
  const [params] = useSearchParams();
  const orderId = params.get("order"), token = params.get("token");
  const paidId = params.get("paid");
  const [order, setOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<Record<string, string>>(() => (paidId ? {} : loadCart()));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !token) return;
    api.status({ orderId, token, step: 5 }).then(({ order: o }) => setOrder(o)).catch(() => undefined);
  }, [orderId, token]);

  // A paid order clears the saved picks; otherwise they survive a trip to Stripe and back.
  useEffect(() => {
    try { if (paidId) sessionStorage.removeItem(CART_KEY); else sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* storage unavailable */ }
  }, [cart, paidId]);

  const items: CartItem[] = useMemo(() => Object.entries(cart).map(([id, option]) => ({ id, option })), [cart]);
  const priced = useMemo(() => (items.length ? priceCart(items) : null), [items]);
  const total = priced && !("error" in priced) ? priced.totalCents : 0;
  const lines = priced && !("error" in priced) ? priced.lines : [];
  const needsContact = !order;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const pick = (id: string, option: string) => setCart((c) => {
    const next = { ...c };
    if (next[id] === option) delete next[id]; else next[id] = option;
    return next;
  });

  async function checkout() {
    setErr(null);
    if (!lines.length) return setErr("Pick a size on anything above to add it.");
    if (needsContact && (!name.trim() || !emailOk)) {
      document.getElementById("addons-contact")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return setErr("Add your artist name and an email so we know whose order this is.");
    }
    setBusy(true);
    try {
      const r = await api.addonsCheckout({ orderId: orderId ?? undefined, token: token ?? undefined, name: name.trim(), email: email.trim(), items, notes: notes.trim() });
      if (r.url) window.location.href = r.url; else setErr(r.error ?? "Checkout is not available yet.");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const affirm = total >= Math.max(AFFIRM_MIN_CENTS, 25_000) && total <= AFFIRM_MAX_CENTS;
  const backQuery = orderId && token ? `?order=${orderId}&token=${token}` : "";

  return (
    <main className="min-h-screen bg-ink font-sans text-bone">
      <SEO title="Add-ons — PMG" description="Clips, cover art, photos, merch and more, with sizes and prices." path="/start/addons" />
      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28 md:px-10 md:pt-36">
        <header className="pb-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-ash">Propmyganda · Add-ons{order?.catalogue_no ? ` · ${order.catalogue_no}` : ""}</p>
          <h1 className="mt-5 font-poster text-[17vw] uppercase leading-[0.88] sm:text-[96px] md:text-[128px]">Take it further.</h1>
          <div aria-hidden="true" className="mt-6 h-2.5 w-40 bg-blood" />
          <p className="mt-6 max-w-2xl text-[18px] font-medium leading-[1.45] md:text-[22px]">
            {order ? `${order.artist_name}, your date is held.` : "Your date is held."} Everything else we make is here, with the price on it. Pick a size on anything you want and pay once at the bottom. Nothing here changes your booking.
          </p>
        </header>

        {paidId && (
          <div className="mb-10 border-l-4 border-blood bg-coal px-5 py-4">
            <p className="font-poster text-[28px] uppercase leading-none text-bone">Paid. It's in.</p>
            <p className="mt-2 text-[15px] leading-6 text-smoke">The receipt and the list are in your email. A person on the team replies on that thread to line each one up.</p>
          </div>
        )}
        {params.get("cancelled") && !paidId && <div className="mb-8"><Note>Checkout was closed before paying. Your picks are still here.</Note></div>}

        <nav aria-label="Jump to" className="flex flex-wrap gap-2 border-y border-rule py-3">
          {ADDON_CATEGORIES.map((c) => (
            <a key={c} href={`#${c.toLowerCase()}`} className="border border-edge px-3 py-2 text-[13px] font-bold uppercase tracking-[0.12em] text-bone hover:border-bone">{c === "Bundle" ? "The bundle" : c}</a>
          ))}
        </nav>

        {ADDON_CATEGORIES.map((c, i) => {
          const list = ADDONS.filter((a) => a.category === c);
          if (!list.length) return null;
          return (
            <section key={c} id={c.toLowerCase()} className="scroll-mt-28 pt-12">
              <div className="flex items-baseline gap-4">
                <span className="font-poster text-[40px] leading-none text-blood md:text-[48px]">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-poster text-[28px] uppercase leading-none tracking-[0.01em] text-bone md:text-[36px]">{c === "Bundle" ? "The bundle" : c}</h2>
              </div>
              <div className="mt-6 space-y-10">
                {list.map((a) => <AddOnBlock key={a.id} a={a} picked={cart[a.id]} onPick={(o) => pick(a.id, o)} orderRef={order?.catalogue_no} />)}
              </div>
            </section>
          );
        })}

        <section className="pt-14">
          <div className="flex items-baseline gap-4">
            <span className="font-poster text-[40px] leading-none text-blood md:text-[48px]">{String(ADDON_CATEGORIES.length + 1).padStart(2, "0")}</span>
            <h2 className="font-poster text-[28px] uppercase leading-none tracking-[0.01em] text-bone md:text-[36px]">Your order</h2>
          </div>
          {lines.length === 0 ? (
            <div className="mt-5"><Note>Nothing picked yet. Tap a size on anything above and it lands here.</Note></div>
          ) : (
            <dl className="mt-5 max-w-2xl border border-rule bg-coal px-5 py-2 md:px-6">
              {lines.map((l) => (
                <div key={l.id} className="flex items-baseline justify-between gap-6 border-b border-rule py-3 text-[15px] leading-6">
                  <dt className="text-bone">{l.name} <span className="text-ash">· {l.label}</span> <button type="button" onClick={() => pick(l.id, l.option)} className="ml-2 text-[13px] font-bold text-ash underline underline-offset-4 hover:text-bone">remove</button></dt>
                  <dd className="shrink-0 font-medium text-bone">{formatUsd(l.priceCents)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-[15px] font-bold uppercase tracking-[0.12em] text-ash">Total</dt>
                <dd className="font-poster text-[36px] leading-none text-bone">{formatUsd(total)}</dd>
              </div>
            </dl>
          )}

          {lines.length > 0 && (
            <div id="addons-contact" className="mt-8 max-w-2xl space-y-5">
              {needsContact && (
                <>
                  <Input id="addons-name" label="Artist name" required autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input id="addons-email" label="Email" hint="The receipt and the follow-up go here." type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </>
              )}
              <Textarea label="Anything we should know" optional value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Note>Payments by Stripe: cards, Apple Pay, Google Pay, Link{affirm ? ", or Affirm to pay over time" : ""}. Ad spend, where there is any, is billed at cost and never marked up.</Note>
            </div>
          )}
          {err && <div className="mt-6 max-w-2xl"><ErrorLine>{err}</ErrorLine></div>}
        </section>

        <StepNav
          summary={lines.length
            ? <><span className="font-bold text-bone">{lines.length} add-on{lines.length > 1 ? "s" : ""} · {formatUsd(total)}</span>{affirm && <span className="text-ash"> · or from about {formatUsd(monthlyEstimateCents(total))}/mo with Affirm</span>}</>
            : <span>Pick a size on anything above to add it.</span>}
        >
          <Button onClick={checkout} disabled={busy}>{busy ? "Opening checkout…" : lines.length ? `Pay ${formatUsd(total)}` : "Checkout"}</Button>
        </StepNav>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to={orderId && token ? `/start/done${backQuery}` : "/start/prep"} className="inline-flex min-h-[52px] items-center border border-rule px-7 text-[14px] font-bold uppercase tracking-[0.12em] text-bone transition-colors hover:border-bone">{orderId && token ? "Back to your booking" : "The prep guide"}</Link>
        </div>
      </div>
    </main>
  );
}
