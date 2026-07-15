import { SUPPORTED_REGIONS } from '../lib/regionConfig';

interface RegionPickerProps {
  region: string;
  onChange: (region: string) => void;
}

export default function RegionPicker({ region, onChange }: RegionPickerProps) {
  return (
    <div className="flex items-center gap-2 px-5 pb-2 pt-1">
      <span className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">Region</span>
      <div className="relative">
        <select
          aria-label="Select region"
          value={region}
          onChange={e => onChange(e.target.value)}
          className="appearance-none bg-void border border-line rounded-md pl-2.5 pr-6 py-1 font-mono text-[11px] text-ink-dim hover:border-maroon focus:border-maroon focus:outline-none cursor-pointer transition-colors"
        >
          {SUPPORTED_REGIONS.map(r => (
            <option key={r.code} value={r.code}>{r.label}</option>
          ))}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-faint text-[9px]">▾</span>
      </div>
    </div>
  );
}
