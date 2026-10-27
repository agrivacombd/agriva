import Link from "next/link";

type MobileDashboardNavProps = {
  active: "dashboard" | "search" | "marketplace" | "profile";
};

const items = [
  { id: "dashboard", href: "/dashboard", label: "ড্যাশবোর্ড", icon: "🏠" },
  { id: "search", href: "/search", label: "AI সহায়তা", icon: "✨" },
  { id: "marketplace", href: "/marketplace", label: "মার্কেটপ্লেস", icon: "🛒" },
  { id: "profile", href: "/profile", label: "প্রোফাইল", icon: "👤" },
] as const;

export default function MobileDashboardNav({ active }: MobileDashboardNavProps) {
  return (
    <nav aria-label="মোবাইল নেভিগেশন" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e2e9df] bg-white/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(23,59,45,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs transition ${selected ? "bg-[#eaf4eb] font-bold text-[#126b4f]" : "font-semibold text-[#617467] hover:bg-[#f2f7f0] hover:text-[#126b4f]"}`}
            >
              <span aria-hidden="true" className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
