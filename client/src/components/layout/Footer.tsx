import { BUILD_INFO } from '../../lib/version';

const isUnavailable = (value: string): boolean =>
  value === 'dev' || value === 'unknown';

export default function Footer() {
  if (isUnavailable(BUILD_INFO.sha) || isUnavailable(BUILD_INFO.date)) {
    return null;
  }

  return (
    <footer className="px-6 pb-24 pt-8 md:pb-8" aria-label="Build information">
      <p className="text-xs text-white/30">
        Build: {BUILD_INFO.sha} • {BUILD_INFO.date}
      </p>
    </footer>
  );
}