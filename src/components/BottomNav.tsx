import React, { useRef, useState, useEffect } from "react";
import { Home, Search, Bookmark, User, Heart } from "lucide-react";
import { useApp } from "../context/AppContext";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "motion/react";

interface BottomNavProps {
  activeTab: "home" | "search" | "watchlist" | "liked" | "profile";
  setActiveTab: (tab: "home" | "watchlist" | "liked") => void;
  onSearchClick: () => void;
  onOpenAuth: () => void;
}

interface DockIconProps {
  mouseX: any;
  isActive?: boolean;
  label: string;
  action: () => void;
  children: React.ReactNode;
}

function DockIcon({
  mouseX,
  isActive,
  label,
  action,
  children
}: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate distance from the mouse pointer to the center of this icon button
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Map the distance to physical dimensions: closer = larger (max 72px, min 44px)
  const widthTransform = useTransform(distance, [-150, 0, 150], [44, 72, 44]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [44, 72, 44]);

  // Map the distance to inner icon dimensions: closer = larger (max 32px, min 20px)
  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 32, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 32, 20]);

  // Apply smooth springs for fluid physical feedback
  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12
  });

  // Hide tooltip and reset when user scrolls to prevent stuck UI
  useEffect(() => {
    const handleScroll = () => {
      setHovered(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.button
      ref={ref}
      onClick={() => {
        action();
        setHovered(false); // Clear hover on tap/click to prevent stuck labels
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-full flex items-center justify-center cursor-pointer select-none outline-none focus:outline-none group transition-shadow duration-300 will-change-transform"
      style={{ width: width as any, height: height as any }}
    >
      {/* Active Backing glow pill */}
      {isActive && (
        <motion.span
          layoutId="bottomNavActive"
          className="absolute inset-0 bg-brand-red rounded-full shadow-lg shadow-brand-red/40"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Dynamic scaled children content wrapped inside width/height animated container */}
      <motion.div 
        style={{ width: widthIcon as any, height: heightIcon as any }}
        className="relative z-10 flex items-center justify-center w-full h-full"
      >
        {children}
      </motion.div>

      {/* Tooltip on hover with pointer-events-none so it never blocks scrolling or clicks */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="absolute left-1/2 -top-12 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-neutral-950/95 border border-white/10 text-white text-[10px] font-sans font-medium tracking-wide whitespace-nowrap shadow-2xl backdrop-blur-md pointer-events-none"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function BottomNav({ activeTab, setActiveTab, onSearchClick, onOpenAuth }: BottomNavProps) {
  const { user, activeProfile, selectProfile, setSearchQuery } = useApp();
  const mouseX = useMotionValue(Infinity);

  // Collapse the dock wave expansion on scroll to prevent stuck layouts
  useEffect(() => {
    const handleScroll = () => {
      mouseX.set(Infinity);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mouseX]);

  const handleProfileClick = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    // Manage profiles trigger
    selectProfile(null);
  };

  const navItems = [
    {
      id: "home" as const,
      label: "Home",
      icon: Home,
      action: () => {
        setActiveTab("home");
        setSearchQuery("");
      }
    },
    {
      id: "search" as const,
      label: "Search",
      icon: Search,
      action: onSearchClick
    },
    {
      id: "watchlist" as const,
      label: "My List",
      icon: Bookmark,
      action: () => {
        if (!user) {
          onOpenAuth();
          return;
        }
        setActiveTab("watchlist");
      }
    },
    {
      id: "liked" as const,
      label: "Liked",
      icon: Heart,
      action: () => {
        if (!user) {
          onOpenAuth();
          return;
        }
        setActiveTab("liked");
      }
    }
  ];

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-3 bg-[#12090B]/85 hover:bg-[#12090B]/95 border border-white/10 backdrop-blur-xl px-4 pb-3 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.8)] pointer-events-auto transition-all duration-300 max-w-lg mx-auto h-[68px]"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <DockIcon
              key={item.id}
              mouseX={mouseX}
              isActive={isActive}
              label={item.label}
              action={item.action}
            >
              <div className="w-[45%] h-[45%] flex items-center justify-center transition-colors duration-300">
                <Icon 
                  className={isActive ? "text-white" : "text-gray-400 group-hover:text-white"} 
                  size="100%" 
                />
              </div>
            </DockIcon>
          );
        })}

        {/* Profile Avatar / Login Icon inside the Dock */}
        <DockIcon
          mouseX={mouseX}
          isActive={activeTab === "profile"}
          label={user ? (activeProfile ? `Profile: ${activeProfile.name}` : "Switch Profile") : "Log In"}
          action={handleProfileClick}
        >
          {user ? (
            <img
              src={activeProfile ? activeProfile.avatar_url : user.avatar_url}
              alt="Profile"
              className="w-[60%] h-[60%] rounded-full border border-brand-red/30 group-hover:border-brand-red/80 shadow transition-all duration-300 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-[45%] h-[45%] flex items-center justify-center text-gray-400 group-hover:text-white transition-all duration-300">
              <User size="100%" />
            </div>
          )}
        </DockIcon>
      </motion.div>
    </div>
  );
}
