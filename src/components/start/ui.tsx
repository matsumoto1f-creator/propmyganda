import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Form pieces for /start, in the Release Onboarding document's system: ink ground, bone type,
// one red, Anton for display and Archivo for everything you read. Sharp corners.
// Fields are 16px so phones don't zoom on focus; only optional fields are marked.

export function Label({ children, hint, optional }: { children: ReactNode; hint?: string; required?: boolean; optional?: boolean }) {
  return (
    <span className="mb-2 block">
      <span className="block text-[12px] font-bold uppercase tracking-[0.16em] text-smoke">
        {children}
        {optional && <span className="ml-2 font-medium normal-case tracking-normal text-ash">optional</span>}
      </span>
      {hint && <span className="mt-1 block text-[13px] leading-5 text-ash">{hint}</span>}
    </span>
  );
}

const field = "w-full border bg-coal px-4 py-3.5 text-[16px] leading-6 text-bone outline-none transition-colors placeholder:text-ash/60 focus:border-bone";
const border = (error?: string) => (error ? "border-blood-hi" : "border-edge");

export function FieldError({ children, id }: { children?: string; id?: string }) {
  if (!children) return null;
  return <span id={id} role="alert" className="mt-2 block text-[13px] font-medium leading-5 text-blood-hi">{children}</span>;
}

type Marks = { label: string; hint?: string; error?: string; optional?: boolean };

export function Input({ label, hint, error, optional, required, id, ...props }: InputHTMLAttributes<HTMLInputElement> & Marks) {
  const errId = id ? `${id}-error` : undefined;
  return (
    <label className="block">
      <Label hint={hint} optional={optional}>{label}</Label>
      <input id={id} aria-invalid={!!error || undefined} aria-describedby={error ? errId : undefined} aria-required={required || undefined} {...props} className={`${field} ${border(error)} ${props.className ?? ""}`} />
      <FieldError id={errId}>{error}</FieldError>
    </label>
  );
}

export function Select({ label, hint, error, optional, required, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & Marks) {
  return (
    <label className="block">
      <Label hint={hint} optional={optional}>{label}</Label>
      <span className="relative block">
        <select aria-invalid={!!error || undefined} aria-required={required || undefined} {...props} className={`${field} ${border(error)} appearance-none pr-10`}>{children}</select>
        <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-2 w-2 -translate-y-[70%] rotate-45 border-b-2 border-r-2 border-smoke" />
      </span>
      <FieldError>{error}</FieldError>
    </label>
  );
}

export function Textarea({ label, hint, error, optional, required, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & Marks) {
  return (
    <label className="block">
      <Label hint={hint} optional={optional}>{label}</Label>
      <textarea aria-invalid={!!error || undefined} aria-required={required || undefined} {...props} className={`${field} ${border(error)} min-h-[112px]`} />
      <FieldError>{error}</FieldError>
    </label>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`flex min-h-[56px] w-full items-center justify-between gap-4 border px-4 py-3 text-left transition-colors ${checked ? "border-bone" : "border-edge hover:border-bone"}`}>
      <span>
        <span className="block text-[16px] font-medium leading-6 text-bone">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-5 text-ash">{hint}</span>}
      </span>
      <span aria-hidden="true" className={`flex h-7 w-12 shrink-0 items-center border p-0.5 transition-colors ${checked ? "border-blood bg-blood" : "border-ash bg-transparent"}`}>
        <span className={`h-5 w-5 transition-transform duration-200 ${checked ? "translate-x-5 bg-white" : "bg-ash"}`} />
      </span>
    </button>
  );
}

export function Button({ children, onClick, type = "button", disabled, tone = "red", className = "" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; tone?: "red" | "ghost"; className?: string }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[52px] px-7 py-3.5 text-[14px] font-bold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "red" ? "bg-blood text-white hover:bg-bone hover:text-ink disabled:hover:bg-blood disabled:hover:text-white" : "border border-edge text-bone hover:border-bone"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** A quiet text action: "add a field", "skip", "more dates". */
export function TextButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-[44px] text-left text-[14px] font-bold text-bone underline decoration-blood decoration-2 underline-offset-4 hover:text-blood-hi ${className}`}>
      {children}
    </button>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-6 text-ash">{children}</p>;
}

export function ErrorLine({ children }: { children: ReactNode }) {
  return <p role="alert" className="border-l-4 border-blood bg-coal px-4 py-3 text-[14px] font-medium leading-6 text-bone">{children}</p>;
}

/** The document's numbered section head: red numeral, Anton title. */
export function SectionHead({ n, title, children }: { n?: string; title: string; children?: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-4">
        {n && <span className="font-poster text-[40px] leading-none text-blood md:text-[48px]">{n}</span>}
        <h2 className="font-poster text-[28px] uppercase leading-none tracking-[0.01em] text-bone md:text-[36px]">{title}</h2>
      </div>
      {children && <div className="mt-3 max-w-2xl text-[15px] leading-6 text-smoke">{children}</div>}
    </div>
  );
}

/** A line with the document's red square bullet. */
export function Bullet({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "light" }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className="mt-[9px] h-[7px] w-[7px] shrink-0 bg-blood" />
      <span className={tone === "light" ? "text-ink" : "text-bone"}>{children}</span>
    </li>
  );
}

/** Back on the left, the next action on the right, always in reach at the bottom of the screen. */
export function StepNav({ onBack, summary, children }: { onBack?: () => void; summary?: ReactNode; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 -mx-6 mt-10 border-t border-rule bg-ink/95 px-6 py-3 backdrop-blur sm:py-4 md:-mx-10 md:px-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {summary && <div className="min-w-0 text-[13px] leading-5 text-smoke sm:flex-1 sm:text-[15px] sm:leading-6">{summary}</div>}
        {/* On a phone the next action fills the row; Back, when there is one, sits beside it. */}
        <div className={`flex items-center gap-3 [&>button:last-child]:flex-1 sm:[&>button:last-child]:flex-none ${summary ? "" : "sm:flex-1"} ${onBack ? "sm:justify-between" : "sm:justify-end"}`}>
          {onBack && <Button tone="ghost" onClick={onBack}>Back</Button>}
          {children}
        </div>
      </div>
    </div>
  );
}
