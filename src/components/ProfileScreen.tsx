import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Profile } from "../types";
import { Plus, Trash2, Edit2, Check, ArrowLeft, ShieldAlert } from "lucide-react";

export default function ProfileScreen() {
  const { user, profiles, selectProfile, createProfile, deleteProfile } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingMode, setIsDeletingMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [isKids, setIsKids] = useState(false);
  
  const avatars = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Aiden",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Nala",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Leo",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Zara",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Kai",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Luna"
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createProfile(newName.trim(), selectedAvatar, isKids);
      setNewName("");
      setIsKids(false);
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this profile? All personalized lists and watch history will be lost.")) {
      await deleteProfile(id);
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-brand-maroon flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl animate-fade-in">
          <button
            onClick={() => setIsCreating(false)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs font-mono mb-6 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Profiles</span>
          </button>

          <h2 className="font-display font-black text-2xl text-white tracking-tight mb-2">
            Create Profile
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Add a profile for another person watching Allrated.
          </p>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-gray-400 tracking-wider">
                Profile Name
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Rachel, Kids Zone..."
                maxLength={15}
                className="w-full px-4 py-3 bg-[#12090B] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-brand-red text-sm transition"
              />
            </div>

            {/* Avatar Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase text-gray-400 tracking-wider">
                Select Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {avatars.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`aspect-square rounded-xl p-1 overflow-hidden border-2 transition relative cursor-pointer ${
                      selectedAvatar === av
                        ? "border-brand-red bg-brand-red/10 scale-105"
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <img src={av} alt="Avatar option" className="w-full h-full object-cover" />
                    {selectedAvatar === av && (
                      <div className="absolute top-1 right-1 bg-brand-red text-white p-0.5 rounded-full">
                        <Check size={8} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Kids Profile Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#12090B] border border-white/5 rounded-xl">
              <div className="flex flex-col pr-4">
                <span className="text-xs font-semibold text-white">Kids Profile?</span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Filters out heavy content and shows kids-friendly recommendations.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsKids(!isKids)}
                className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                  isKids ? "bg-brand-red" : "bg-white/10"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-all absolute top-1 ${
                    isKids ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-red text-white text-xs font-bold uppercase rounded-xl tracking-wider hover:bg-[#ff1525] transition active:scale-95 shadow-md shadow-brand-red/10 cursor-pointer"
            >
              Create Profile
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-maroon flex flex-col items-center justify-center px-6 py-24 relative select-none">
      {/* Background elegant gradient accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center space-y-12 max-w-4xl w-full animate-fade-in z-10">
        <div className="space-y-3">
          <h1 className="font-display font-black text-4xl md:text-5xl text-white tracking-tight">
            Who's Watching?
          </h1>
          <p className="text-xs md:text-sm text-gray-400 font-mono">
            Personalized watchlists, histories, and affinity recommendations.
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {profiles.map((prof) => (
            <div
              key={prof.id}
              className="flex flex-col items-center gap-3 group relative w-24 md:w-28"
            >
              {/* Profile Card Button */}
              <button
                onClick={() => {
                  if (isDeletingMode) {
                    handleDelete(prof.id);
                  } else {
                    selectProfile(prof);
                  }
                }}
                className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 shadow-xl hover:shadow-2xl transition-all duration-300 relative cursor-pointer flex items-center justify-center bg-[#12090B] ${
                  isDeletingMode 
                    ? "border-brand-red animate-pulse" 
                    : "border-white/5 group-hover:border-white scale-100 group-hover:scale-105"
                }`}
              >
                <img
                  src={prof.avatar_url}
                  alt={prof.name}
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition duration-300"
                  referrerPolicy="no-referrer"
                />

                {/* Overlays */}
                {isDeletingMode ? (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Trash2 className="text-brand-red animate-bounce" size={24} />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                )}
              </button>

              {/* Name and Tag */}
              <div className="text-center w-full">
                <span className="block text-sm font-semibold text-gray-300 group-hover:text-white truncate transition">
                  {prof.name}
                </span>
                {prof.is_kids && (
                  <span className="inline-block text-[8px] font-mono font-bold bg-brand-red/10 text-brand-red px-1 rounded mt-1 uppercase">
                    Kids
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Add Profile Button */}
          {profiles.length < 5 && (
            <div className="flex flex-col items-center gap-3 w-24 md:w-28">
              <button
                onClick={() => setIsCreating(true)}
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/40 hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-300 hover:scale-105 cursor-pointer bg-[#12090B]/50"
                title="Add Profile"
              >
                <Plus size={32} />
              </button>
              <span className="text-xs font-mono text-gray-500">Add Profile</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {profiles.length > 0 && (
            <button
              onClick={() => setIsDeletingMode(!isDeletingMode)}
              className={`px-6 py-2.5 rounded-xl border text-xs font-semibold font-mono tracking-wider transition uppercase cursor-pointer ${
                isDeletingMode
                  ? "bg-brand-red text-white border-brand-red hover:bg-[#ff1525]"
                  : "bg-transparent text-gray-400 border-white/10 hover:text-white hover:border-white/30"
              }`}
            >
              {isDeletingMode ? "Done Managing" : "Manage Profiles"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
