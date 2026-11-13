import { ORDER_STATUS_LABEL, type LocalOrder, type OrderStatus } from "@/lib/local-admin";
import { formatILS } from "@/lib/money";
import { formatQuantity } from "@/lib/quantity";

const STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800",
  CONFIRMED: "bg-brand-50 text-brand-700",
  IN_PREPARATION: "bg-amber-50 text-amber-800",
  READY: "bg-leaf-50 text-leaf-700",
  OUT_FOR_DELIVERY: "bg-leaf-50 text-leaf-700",
  COMPLETED: "bg-leaf-600 text-white",
  CANCELLED: "bg-line text-muted",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASS[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

/** The order's lines and totals, shared by the admin screen and the customer's order history. */
export function OrderLines({ order }: { order: LocalOrder }) {
  const { totals } = order;
  return (
    <div className="space-y-1.5 text-sm">
      {order.lines.map((l) => (
        <div key={l.productId} className="flex justify-between gap-3">
          <span>{l.name} · <span className="text-muted">{formatQuantity(l.quantity, l.saleUnit)}</span></span>
          <span className="tabular-nums">{formatILS(l.lineTotalAgorot)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-3 text-muted">
        <span>{order.fulfillment === "DELIVERY" ? "דמי משלוח" : "איסוף עצמי"}</span>
        <span className="tabular-nums">{totals.deliveryFeeAgorot ? formatILS(totals.deliveryFeeAgorot) : "חינם"}</span>
      </div>
      <div className="flex justify-between gap-3 border-t border-line pt-2 font-bold">
        <span>סה״כ</span>
        <span className="tabular-nums">{formatILS(totals.totalAgorot)}</span>
      </div>
    </div>
  );
}
