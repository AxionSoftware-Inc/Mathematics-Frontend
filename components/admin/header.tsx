import { Bell, Search, Command } from "lucide-react";

export function AdminHeader() {
    return (
        <header className="h-20 border-b border-white/10 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-8 sticky top-0 z-20 w-full shadow-sm">
            <div className="flex-1 flex max-w-xl relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-white transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Qidiruv kiritish uchun / tugmasini bosing..."
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-white shadow-inner placeholder:text-gray-500"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-black/50 border border-white/10 text-[10px] font-medium text-gray-400 font-mono">
                        <Command className="w-3 h-3" /> K
                    </kbd>
                </div>
            </div>

            <div className="flex items-center gap-6 ml-6">
                <button className="relative p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
                </button>

                <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

                <div className="flex items-center gap-4 cursor-pointer group p-1.5 pr-4 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-white to-gray-400 flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform">
                        AQ
                    </div>
                    <div className="flex flex-col text-right hidden sm:block pt-0.5">
                        <p className="text-sm font-bold text-white group-hover:text-gray-200 transition-colors leading-none tracking-tight">Admin Quvonchbek</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">Super Admin</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
