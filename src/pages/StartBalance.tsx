import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { api } from "@/lib/onboarding";
import { Note } from "@/components/start/ui";

/** /start/balance?order=&token= — opens Stripe for the remaining amount on a deposit order. */
export default function StartBalance() {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "paid" | "error">("loading");
  const [msg, setMsg] = useState("");
  const orderId = params.get("order"), token = params.get("token");
  useEffect(() => {
    if (!orderId || !token) { setState("error"); setMsg("This link is missing its order."); return; }
    api.balanceLink({ orderId, token, step: 5 }).then((r) => {
      if (r.paid) { setState("paid"); return; }
      if (r.url) { window.location.href = r.url; return; }
      setState("error"); setMsg(r.error ?? "Could not open the payment page.");
    }).catch((e) => { setState("error"); setMsg((e as Error).message); });
  }, [orderId, token]);
  return (
    <main className="min-h-screen bg-ink font-sans text-bone">
      <SEO title="Balance — PMG" description="Pay the balance on your PMG booking." path="/start/balance" />
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-28 md:px-10 md:pt-36">
        <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-ash">Propmyganda · Balance</p>
        <h1 className="mt-5 font-poster text-[17vw] uppercase leading-[0.88] sm:text-[96px] md:text-[128px]">{state === "paid" ? "Paid in full." : state === "error" ? "Hold on." : "Opening Stripe…"}</h1>
        <div aria-hidden="true" className="mt-6 h-2.5 w-40 bg-blood" />
        <div className="mt-6 max-w-md">
          {state === "loading" && <Note>Taking you to the payment page for the remaining amount.</Note>}
          {state === "paid" && <Note>Nothing left to pay on this booking. See you at the shoot.</Note>}
          {state === "error" && <Note>{msg} Reply to your confirmation email and we sort it, or bring cash on the day.</Note>}
          <p className="mt-6"><Link to="/" className="inline-flex min-h-[52px] items-center border border-rule px-7 text-[14px] font-bold uppercase tracking-[0.12em] text-bone transition-colors hover:border-bone">Home</Link></p>
        </div>
      </div>
    </main>
  );
}
