import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { AreaBlocks, TipsBlocks } from "@/components/start/prep";
import AddOns from "@/components/start/AddOns";

// What an artist can do to make the post land, plus how to get to the room and
// what's around it. Plain, short, the way the rest of the flow reads.
export default function StartPrep() {
  return (
    <main className="min-h-screen bg-ink font-sans text-bone">
      <SEO title="Prep — PMG" description="The first five minutes after the collab posts, how to get to the room in DUMBO, and what's around it." path="/start/prep" />
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-28 md:px-10 md:pt-36">
        <header className="pb-10">
          <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-ash">Propmyganda · Prep</p>
          <h1 className="mt-5 font-poster text-[17vw] uppercase leading-[0.88] sm:text-[96px] md:text-[128px]">Make it land.</h1>
          <div aria-hidden="true" className="mt-6 h-2.5 w-40 bg-blood" />
          <p className="mt-6 max-w-xl text-[18px] font-medium leading-[1.45] md:text-[22px]">
            The push works if you're in it. Here's the whole of what we ask, and what's around the room.
          </p>
        </header>

        <AreaBlocks from={1} />
        <TipsBlocks from={3} />
        <AddOns />

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/start" className="inline-flex min-h-[52px] items-center bg-blood px-7 text-[14px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-bone hover:text-ink">Back to your order</Link>
          <Link to="/artists" className="inline-flex min-h-[52px] items-center border border-rule px-7 text-[14px] font-bold uppercase tracking-[0.12em] text-bone transition-colors hover:border-bone">The roster</Link>
        </div>
      </div>
    </main>
  );
}
