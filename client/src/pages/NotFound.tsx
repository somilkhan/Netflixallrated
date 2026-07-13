/**
 * NotFound — bingr-style 404 page.
 * "404. Well, fuck." with a meme image and "Take me home, Daddy" button.
 */
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const nav = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] md:min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6 page-enter">
      {/* Meme image */}
      <div
        className="w-[220px] h-[220px] rounded-2xl overflow-hidden bg-white flex items-center justify-center"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
      >
        <img
          src="https://media.giphy.com/media/3oEjI5VtIhHvK37WYo/giphy.gif"
          alt="404"
          className="w-full h-full object-cover"
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="text-6xl" style={{ display: 'none' }}>💀</span>
      </div>

      <div className="space-y-3 max-w-[440px]">
        <h1 className="font-sans font-bold text-[32px] leading-tight text-white">
          404. Well, fuck.
        </h1>
        <p className="font-sans text-[14px] text-[#888] leading-relaxed">
          The page you're looking for is either dead, missing, or out banging someone's mom. Don't worry, it happens to a lot of guys.
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
        Take me home, Daddy
      </button>
    </div>
  );
}
