export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="ja-kpi">
      <p className="ja-label">{label}</p>
      <p className="ja-kpi__value text-2xl sm:text-3xl">{value}</p>
      {hint && <p className="text-sm text-fg-muted">{hint}</p>}
    </div>
  );
}
