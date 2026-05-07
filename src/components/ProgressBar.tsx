type Props = {
  current: number;   // 1-indexed domain number
  total: number;
  domainLabel: string;
};

export default function ProgressBar({ current, total, domainLabel }: Props) {
  const pct = Math.round(((current - 1) / total) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium text-gray-700 truncate">
          <span className="text-primary-700 font-semibold">
            Domain {current} of {total}
          </span>
          {' — '}
          {domainLabel}
        </p>
        <span className="flex-shrink-0 text-xs text-gray-400">{pct}% complete</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-700 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
