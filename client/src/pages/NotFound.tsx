/**
 * Friendly 404 page with a clear recovery path.
 */
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const nav = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] md:min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6 page-enter">
      <div
        className="w-[160px] h-[160px] rounded-3xl overflow-hidden bg-white/[.04] border border-white/10 flex items-center justify-center"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
      >
        <span className="text-6xl font-bold tracking-tight text-white/80">404</span>
      </div>

      <div className="space-y-3 max-w-[440px]">
        <h1 className="font-sans font-bold text-[32px] leading-tight text-white">
          Page not found
        </h1>
        <p className="font-sans text-[14px] text-[#888] leading-relaxed">
          This page doesn’t exist or may have moved. Let’s get you back to something good.
        </p>
      </div>

      <button
        onClick={() => nav('/')}
        className="
          mt-2 px-6 py-2.5 rounded-xl
          bg-[#1a1a1a] border border-white/10
          font-sans font-semibold text-[14px] text-white
          hover:bg-white/10 active:scale-[0.97]
          transition-all duration-150
        "
      >
         Go Home
      </button>
    </div>
  );
}
