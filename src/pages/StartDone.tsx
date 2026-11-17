import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { api, fmtSlot, saveSession, type Order } from "@/lib/onboarding";
import { formatUsd, getTier } from "@/lib/tiers";
import { Note } from "@/components/start/ui";
import AddOns from "@/components/start/AddOns";

export default function StartDone() {
  const [params] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [tries, setTries] = useState(0);
  const orderId = params.get("order"), token = params.get("token");

  // Stripe sends the artist here before the webhook has always landed; poll a few times.
  useEffect(() => {
    if (!orderId || !token) return;
    saveSession(null);
    let stop = false;
    const tick = async (n: number) => {
      try {
        const { order: o } = await api.status({ orderId, token, step: 5 });
        if (stop) return;
        setOrder(o);
        if (!o.paid_at && n < 8) { setTries(n + 1); setTimeout(() => tick(n + 1), 2000); }
      } catch { /* shown as pending */ }
    };
    tick(0);
    return () => { stop = true; };
  }, [orderId, token]);

  const tier = order ? getTier(order.tier) : undefined;
  const paid = !!order?.paid_at;

  return (
    <main className="min-h-screen bg-ink font-sans text-bone">
      <SEO title="You're in — PMG" description="Order received." path="/start/done" />
      <header className="mx-auto max-w-5xl px-6 pb-10 pt-28 md:px-10 md:pt-36">
        <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-ash">Propmyganda · {order?.catalogue_no ?? "Receipt"}</p>
        <h1 className="mt-5 font-poster text-[17vw] uppercase leading-[0.88] sm:text-[96px] md:text-[128px]">{paid ? "Welcome to the machine." : "Confirming…"}</h1>
        <div aria-hidden="true" className="mt-6 h-2.5 w-40 bg-blood" />
      </header>
      <section className="mx-auto max-w-5xl px-6 pb-20 md:px-10">
        <div className="max-w-2xl">
          {!order ? (
            <Note>{tries > 0 ? "Confirming your order…" : "Loading your order…"}</Note>
          ) : (
            <dl className="border border-rule bg-coal px-5 py-2 md:px-6">
              {[
                ["Artist", order.artist_name],
                // A plan with nothing to pay shows no price and no payment line.
                ...(order.total_cents > 0
                  ? [["Tier", `${tier?.name ?? order.tier} · ${formatUsd(order.total_cents)}`], ["Paid", paid ? `${formatUsd(order.due_now_cents)}${order.payment_plan === "deposit" ? " deposit" : ""}` : "pending"]]
                  : [["Plan", tier?.name ?? order.tier]]),
                ...(order.session_at ? [["Shoot", `${fmtSlot(order.session_at)} ET · 30 min`]] : []),
                ["Release", order.post_at ? `${fmtSlot(order.post_at)} ET` : "we'll place you by email"],
                ...(order.payment_plan === "deposit" ? [["Balance", order.balance_paid_at ? `paid · ${order.balance_method ?? ""}` : `${formatUsd(order.total_cents - order.due_now_cents)} · the day before the shoot, by link, or cash`]] : []),
                ["Files", String(order.uploads?.length ?? 0)],
                ["Status", order.status.replace("_", " ")],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-6 border-b border-rule py-3 text-[15px] leading-6 last:border-b-0">
                  <dt className="shrink-0 text-ash">{k}</dt><dd className="text-right font-medium text-bone">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {order?.payment_plan === "deposit" && !order.balance_paid_at && (
            <p className="mt-5 border-l-4 border-blood bg-coal px-4 py-3 text-[15px] leading-6 text-bone"><Link to={`/start/balance?order=${orderId}&token=${token}`} className="font-bold text-bone underline decoration-blood decoration-2 underline-offset-4 hover:text-blood-hi">Pay the balance now</Link>, or we charge the card the day before, or bring cash.</p>
          )}
          {params.get("balance") === "paid" && <p className="mt-5 border-l-4 border-blood bg-coal px-4 py-3 text-[15px] font-bold leading-6 text-bone">Balance paid. You're paid in full.</p>}
        </div>

        <div className="mt-14">
          <h2 className="font-poster text-[32px] uppercase leading-none text-bone md:text-[40px]">What happens next</h2>
          <ol className="mt-6 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Jay confirms your submission and your date by email. One thread, start to finish.",
              "Edits get made. Revisions happen in that window, not the day of.",
              "Your record goes out on the date you picked. Collab posts push to TikTok, Instagram and YouTube.",
              "Ad report or dashboard link lands the way you asked.",
            ].map((t, i) => (
              <li key={t} className="border-t-[3px] border-bone pt-3">
                <span className="block font-poster text-[30px] leading-none text-blood">{i + 1}</span>
                <span className="mt-2 block text-[15px] font-medium leading-[22px] text-bone">{t}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-2xl text-[15px] leading-6 text-smoke">Your email has the full guide: getting to the room, what's around it, and how to make the post land. It's also at <Link to="/start/prep" className="font-bold text-bone underline decoration-blood decoration-2 underline-offset-4 hover:text-blood-hi">propmyganda.com/start/prep</Link>.</p>
        </div>

        {paid && <div className="mt-14"><AddOns orderRef={order?.catalogue_no} /></div>}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/artists" className="inline-flex min-h-[52px] items-center bg-blood px-7 text-[14px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-bone hover:text-ink">The roster</Link>
          <Link to="/" className="inline-flex min-h-[52px] items-center border border-rule px-7 text-[14px] font-bold uppercase tracking-[0.12em] text-bone transition-colors hover:border-bone">Home</Link>
        </div>
      </section>
    </main>
  );
}
