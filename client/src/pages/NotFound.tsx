/**
 * Friendly 404 page with a clear recovery path.
 */
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const nav = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] md:min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6 page-enter">
      <div
        className="w-[160px] h-[160px] rounded-3xl overflow-hidden bg-white/[.04] border border-border-light flex items-center justify-center"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
      >
        <span className="text-6xl font-bold tracking-tight text-white/80">404</span>
      </div>

      <div className="space-y-3 max-w-[440px]">
        <h1 className="font-bold text-7xl leading-tight text-white">
          Page not found
        </h1>
        <p className="text-md text-[#888] leading-relaxed">
          This page doesn’t exist or may have moved. Let’s get you back to something good.
        </p>
      </div>

      <button
        onClick={() => nav('/')}
        className="
          mt-2 px-6 py-2.5 rounded-lg
          bg-elevated border border-border-light
          font-semibold text-md text-white
          hover:bg-overlay-medium active:scale-[0.97]
          transition-all duration-150
        "
      >
         Go Home
      </button>
    </div>
  );
}
