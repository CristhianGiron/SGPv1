export function Skeleton({ lines = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          className="block h-3.5 rounded-full bg-panel-soft dark:bg-table-header"
          key={index}
          style={{ width: `${Math.max(42, 96 - index * 9)}%` }}
        />
      ))}
    </div>
  );
}
