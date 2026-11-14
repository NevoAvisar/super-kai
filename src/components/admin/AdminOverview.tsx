"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Banknote, CircleCheck, Clock3, Flame, Truck, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import {
  customerRevenueShare,
  groupByZone,
  isActive,
  PERIOD_LABEL,
  periodKpis,
  statusBreakdown,
  STATUS_GROUP_LABEL,
  todayDateOnly,
  trendPercent,
  trendSeries,
  type Period,
} from "@/lib/admin-analytics";
import { formatILS } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrdersStore } from "@/store/admin";
import { BarChart, ChartCard, Donut, OTHERS, Segmented, SERIES, StackedBars } from "./charts";

const shekels = (agorot: number) => `₪${Math.round(agorot / 100).toLocaleString("he-IL")}`;
const COMPARED: Record<Period, string> = { day: "לעומת אתמול", week: "לעומת השבוע הקודם", month: "לעומת 30 הימים הקודמים" };
const RANGE: Record<Period, string> = { day: "היום", week: "7 הימים האחרונים", month: "30 הימים האחרונים" };

function KpiCard({ icon: Icon, tone, label, value, sub, trend, href }: {
  icon: LucideIcon;
  /** Tailwind classes for the icon chip. */
  tone: string;
  label: string;
  value: string | number;
  sub: string;
  trend?: number | null;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={`flex size-10 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        {trend !== undefined && trend !== null && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${trend >= 0 ? "bg-leaf-50 text-leaf-700" : "bg-brand-50 text-brand-700"}`}>
            {trend >= 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
            <span dir="ltr">{trend > 0 ? "+" : ""}{trend}%</span>
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-muted">{label}</p>
      <p className="font-display text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </>
  );
  const className = "block h-full rounded-3xl bg-paper p-5 ring-1 ring-line";
  return href ? <Link href={href} className={`${className} transition hover:ring-brand-500`}>{body}</Link> : <div className={className}>{body}</div>;
}

export function AdminOverview() {
  const hydrated = useHydrated();
  const orders = useOrdersStore((s) => s.orders);
  const { seedDemoAgain, clearDemo } = useDemoActions();
  const [period, setPeriod] = useState<Period>("week");
  const today = todayDateOnly();

  const kpis = useMemo(() => periodKpis(orders, period, today), [orders, period, today]);
  const series = useMemo(() => trendSeries(orders, period, today), [orders, period, today]);
  const share = useMemo(() => customerRevenueShare(orders, SERIES.length), [orders]);
  const active = useMemo(() => orders.filter(isActive), [orders]);
  const live = statusBreakdown(orders);
  const zones = useMemo(() => groupByZone(active), [active]);

  if (!hydrated) return <p className="py-16 text-center text-muted">טוען…</p>;

  const demoCount = orders.filter((o) => o.isDemo).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">סקירה כללית</h1>
        <div className="sm:ms-auto">
          <Segmented value={period} onChange={setPeriod} label="טווח זמן" options={(Object.keys(PERIOD_LABEL) as Period[]).map((p) => ({ value: p, label: PERIOD_LABEL[p] }))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          icon={Banknote}
          tone="bg-brand-100 text-brand-700"
          label={`הכנסות · ${RANGE[period]}`}
          value={formatILS(kpis.current.revenueAgorot)}
          sub={`${kpis.current.orders} הזמנות · ${COMPARED[period]}`}
          trend={trendPercent(kpis.current.revenueAgorot, kpis.previous.revenueAgorot)}
        />
        <KpiCard
          icon={Truck}
          tone="bg-viz-violet/15 text-viz-violet"
          label={`משלוחים · ${RANGE[period]}`}
          value={kpis.current.deliveries}
          sub={`ועוד ${kpis.current.orders - kpis.current.deliveries} איסופים עצמיים · ${COMPARED[period]}`}
          trend={trendPercent(kpis.current.deliveries, kpis.previous.deliveries)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Clock3} tone="bg-viz-yellow/20 text-amber-800" label={STATUS_GROUP_LABEL.pending} value={live.pending} sub="מחכות לאישור שלך" href="/admin/orders" />
        <KpiCard icon={Flame} tone="bg-viz-blue/15 text-viz-blue" label={STATUS_GROUP_LABEL.open} value={live.open} sub="אושרו, בהכנה או בדרך ללקוח" href="/admin/orders" />
        <KpiCard icon={CircleCheck} tone="bg-viz-green/15 text-viz-green" label={STATUS_GROUP_LABEL.delivered} value={live.delivered} sub="סך כל ההזמנות שנמסרו" href="/admin/orders" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="הכנסות לאורך זמן" note={`לפי יום האספקה · תצוגה ${PERIOD_LABEL[period]}ת`}>
          <BarChart
            label="הכנסות לאורך זמן"
            color="var(--color-brand-500)"
            format={shekels}
            data={series.map((b) => ({ key: b.key, label: b.label, title: b.title, value: b.revenueAgorot }))}
          />
        </ChartCard>
        <ChartCard title="משלוחים לאורך זמן" note={`מספר המשלוחים · תצוגה ${PERIOD_LABEL[period]}ת`}>
          <BarChart
            label="משלוחים לאורך זמן"
            color="var(--color-viz-violet)"
            integer
            format={(n) => String(Math.round(n))}
            data={series.map((b) => ({ key: b.key, label: b.label, title: b.title, value: b.deliveries }))}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[3fr_2fr]">
        <ChartCard title="מי מכניס הכי הרבה כסף" note="חלקו של כל לקוח בהכנסות, מכל ההזמנות שלא בוטלו">
          {share.slices.length ? (
            <Donut
              format={shekels}
              centerLabel="סך ההכנסות"
              slices={share.slices.map((s, i) => ({ key: s.key, name: s.name, value: s.revenueAgorot, color: s.key === "others" ? OTHERS : SERIES[i] }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted">עדיין אין הזמנות להציג.</p>
          )}
        </ChartCard>
        <ChartCard title="הזמנות פעילות לפי אזור" note="ממתינות לאישור ופתוחות, לפי אזור המשלוח">
          {zones.length ? (
            <StackedBars
              unit="הזמנות"
              legend={[
                { label: STATUS_GROUP_LABEL.pending, color: "var(--color-viz-yellow)" },
                { label: STATUS_GROUP_LABEL.open, color: "var(--color-viz-blue)" },
              ]}
              rows={zones.map((z) => ({
                key: z.zone.id,
                label: z.zone.label,
                segments: [
                  { key: "pending", label: STATUS_GROUP_LABEL.pending, value: z.pending, color: "var(--color-viz-yellow)" },
                  { key: "open", label: STATUS_GROUP_LABEL.open, value: z.open, color: "var(--color-viz-blue)" },
                ],
              }))}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted">אין כרגע הזמנות פעילות.</p>
          )}
        </ChartCard>
      </div>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {demoCount > 0 ? (
          <>
            <span>{demoCount} מההזמנות הן הזמנות לדוגמה, כדי שיהיה מה לראות בלוח.</span>
            <button type="button" onClick={clearDemo} className="font-bold text-brand-600 hover:underline">הסרת הזמנות הדוגמה</button>
          </>
        ) : (
          <>
            <span>מוצגות רק הזמנות אמיתיות שבוצעו בדפדפן הזה.</span>
            <button type="button" onClick={seedDemoAgain} className="font-bold text-brand-600 hover:underline">טעינת הזמנות לדוגמה</button>
          </>
        )}
      </p>
    </div>
  );
}

/** Loading / removing the sample orders; the reload asks the layout's product list through a custom event. */
function useDemoActions() {
  const clearDemo = useOrdersStore((s) => s.clearDemo);
  return {
    clearDemo,
    seedDemoAgain: () => window.dispatchEvent(new Event("super-kai:seed-demo")),
  };
}
