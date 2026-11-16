import { ADDONS } from "@/lib/addons";

const CONTACT_EMAIL = "workwithpmg@gmail.com";

/** Shown only once a booking is complete: what else is open to a booked artist, quoted by request. */
export default function AddOns({ orderRef }: { orderRef?: string | null }) {
  const subject = encodeURIComponent(`Add-on${orderRef ? ` · ${orderRef}` : ""}`);
  return (
    <section className="border-t border-rule py-10">
      <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-ash">Open to you now</p>
      <h2 className="mt-2 font-poster text-[36px] uppercase leading-none text-bone md:text-[48px]">Take it further</h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-6 text-smoke">
        Your date is held. These are open to booked artists by request, most of them built from what the shoot already produced. Reply to your confirmation email with the one you want, or <a className="font-bold text-bone underline decoration-blood decoration-2 underline-offset-4 hover:text-blood-hi" href={`mailto:${CONTACT_EMAIL}?subject=${subject}`}>email us</a>, and we quote it. Nothing here changes your booking.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADDONS.map((a) => (
          <li key={a.id} className="border-t-[3px] border-bone pt-3">
            <span className="block text-[16px] font-bold leading-6 text-bone">{a.name}</span>
            <span className="block text-[13px] font-bold uppercase tracking-[0.12em] text-blood-hi">{a.from}</span>
            <span className="mt-1 block text-[14px] leading-[22px] text-ash">{a.line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
