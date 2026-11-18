import { Link } from "react-router-dom";
import { ADDONS, fromLabel } from "@/lib/addons";

/** Shown only once a booking is complete: one door to the add-ons page, where everything has a size and a price. */
export default function AddOns({ orderId, token }: { orderRef?: string | null; orderId?: string | null; token?: string | null }) {
  const to = `/start/addons${orderId && token ? `?order=${orderId}&token=${token}` : ""}`;
  const teaser = ADDONS.filter((a) => !a.quoteOnly && !a.featured).slice(0, 6);
  return (
    <section className="border-t border-rule py-10">
      <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-ash">Open to you now</p>
      <h2 className="mt-2 font-poster text-[36px] uppercase leading-none text-bone md:text-[48px]">Take it further</h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-6 text-smoke">
        Your date is held. Clips, cover art, photos, merch and the rest are on one page, each with its sizes and prices. Pick what you want and pay once. Nothing there changes your booking.
      </p>
      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px] leading-6 text-ash">
        {teaser.map((a) => <li key={a.id}><span className="font-bold text-bone">{a.name}</span> {fromLabel(a)}</li>)}
      </ul>
      <Link to={to} className="mt-7 inline-flex min-h-[52px] items-center bg-blood px-7 text-[14px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-bone hover:text-ink">See the add-ons</Link>
    </section>
  );
}
