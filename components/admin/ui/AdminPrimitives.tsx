import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-800 ring-rose-200",
  info: "bg-blue-50 text-blue-800 ring-blue-200",
};

export function AdminPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`admin-page ${className}`}>{children}</main>;
}

export function AdminPageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string; title: string; description?: string; actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[var(--admin-border)] pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--admin-ink)] sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--admin-ink-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AdminPanel({ children, className = "", padding = "p-4 sm:p-5" }: {
  children: ReactNode; className?: string; padding?: string;
}) {
  return <section className={`admin-panel min-w-0 ${padding} ${className}`}>{children}</section>;
}

export function AdminSectionHeader({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-extrabold tracking-tight text-[var(--admin-ink)] sm:text-lg">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-[var(--admin-ink-muted)]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function AdminMetricCard({ label, value, hint, href, icon, tone = "neutral" }: {
  label: string; value: ReactNode; hint?: string; href?: string; icon?: ReactNode; tone?: Tone;
}) {
  const content = (
    <div className="admin-panel group h-full p-4 transition duration-150 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--admin-ink-muted)]">{label}</p>
        {icon && <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${toneClasses[tone]}`}>{icon}</span>}
      </div>
      <p className="mt-3 break-words text-2xl font-black tabular-nums tracking-tight text-[var(--admin-ink)] sm:text-3xl">{value}</p>
      {hint && <p className="mt-2 text-xs leading-5 text-[var(--admin-ink-muted)]">{hint}</p>}
      {href && <span className="mt-3 inline-flex text-xs font-bold text-[var(--admin-primary)] group-hover:underline">View details ↗</span>}
    </div>
  );
  return href ? <Link href={href} className="block rounded-[var(--admin-radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">{content}</Link> : content;
}

export function AdminStatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${toneClasses[tone]}`}>{children}</span>;
}

export function AdminEmptyState({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-[var(--admin-radius-md)] border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] px-5 py-8 text-center">
      <p className="text-sm font-bold text-[var(--admin-ink)]">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm leading-6 text-[var(--admin-ink-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AdminTableFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`admin-panel overflow-hidden ${className}`}><div className="admin-scrollbar overflow-x-auto">{children}</div></div>;
}
