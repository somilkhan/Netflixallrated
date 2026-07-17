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
          className="appearance-none bg-white/[0.03] border border-white/[0.08] rounded-md pl-2.5 pr-6 py-1 font-mono text-[11px] text-white/50 hover:border-white/[0.16] focus:border-white/[0.22] focus:text-white/80 focus:outline-none cursor-pointer transition-all duration-200"
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
