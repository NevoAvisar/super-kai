export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-brand-600">סופר-קאי</p>
          <p>אוכל מוכן ביתי, מבושל באהבה כל יום מחדש.</p>
        </div>
        <div>
          <p className="font-semibold text-ink">שעות הזמנה</p>
          <p>הזמנה עד 14:30 – אספקה למחרת</p>
          <p>אין אספקה בשבת</p>
        </div>
        <div>
          <p className="font-semibold text-ink">יצירת קשר</p>
          <p>WhatsApp · מייל · איסוף עצמי מהמטבח</p>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted">© {new Date().getFullYear()} סופר-קאי</p>
    </footer>
  );
}
