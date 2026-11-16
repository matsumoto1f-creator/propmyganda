import { useState } from "react";
import AgentChat from "@/components/contact/AgentChat";

/** "Questions?" at the top of every step. Opens the contact agent without leaving the flow. */
export default function QuestionsDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="min-h-[44px] text-[13px] font-bold uppercase tracking-[0.14em] text-bone underline decoration-blood decoration-2 underline-offset-4 hover:text-blood-hi">
        Questions? Chat with PMG
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/70 p-4 sm:p-6" onClick={() => setOpen(false)}>
          <div role="dialog" aria-label="Chat with PMG" className="w-full max-w-md border border-rule bg-ink text-bone" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-rule px-4 py-2">
              <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-ash">A person reads every thread</span>
              <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] px-2 text-[12px] font-bold uppercase tracking-[0.16em] text-bone hover:text-blood-hi">Close</button>
            </div>
            <AgentChat />
          </div>
        </div>
      )}
    </>
  );
}
