import { DIETARY, type DietaryTag } from "@/lib/dietary";

export function DietaryBadge({ tag }: { tag: DietaryTag }) {
  const d = DIETARY[tag];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${d.className}`}>
      {d.label}
    </span>
  );
}
