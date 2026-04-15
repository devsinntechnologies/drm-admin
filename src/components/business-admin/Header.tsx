"use client";

import { ChefHat, LogOut } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full bg-gradient-to-r from-[#3b1de8] via-[#6d28d9] to-[#9400d3] px-4 md:px-8 py-3 flex items-center justify-between shadow-lg">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <ChefHat className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">
            Restaurant Manager
          </h1>
          <p className="text-white/70 text-xs font-medium tracking-wide">
            Admin User • ADMIN
          </p>
        </div>
      </div>

      {/* Right: Logout Button */}
      <button className="flex items-center gap-2 border border-white/30 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </header>
  );
}
