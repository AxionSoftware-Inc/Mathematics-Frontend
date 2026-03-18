import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Settings,
    LogOut,
    Newspaper,
    Library,
    Compass
} from "lucide-react";

const sidebarLinks = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Foydalanuvchilar", href: "/admin/users", icon: Users },
    { name: "Kurslar Akademi", href: "/admin/courses", icon: GraduationCap },
    { name: "Maqolalar (Jurnal)", href: "/admin/articles", icon: Newspaper },
    { name: "Kutubxona", href: "/admin/books", icon: Library },
    { name: "Sozlamalar", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-72 bg-black/80 backdrop-blur-3xl border-r border-white/10 flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.5)] transition-all z-20 hidden md:flex text-white">
            <div className="h-20 flex items-center px-8 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                <Link href="/admin" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-white/60 flex items-center justify-center shadow-lg shadow-white/20 group-hover:shadow-white/40 transition-shadow">
                        <Compass className="w-6 h-6 text-black animate-in spin-in duration-1000" />
                    </div>
                    <div>
                        <h1 className="font-playfair font-bold text-xl tracking-tight text-white group-hover:text-gray-300 transition-colors">
                            Math<span className="text-gray-400">Sphere</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Admin Panel</p>
                    </div>
                </Link>
            </div>

            <div className="flex-1 px-4 py-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Asosiy Menyu
                </div>
                <nav className="space-y-2 flex-1">
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                prefetch={false}
                                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 relative group overflow-hidden
                                    ${isActive 
                                        ? "text-black shadow-lg" 
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`
                                }
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-white -z-10" />
                                )}
                                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "text-black scale-110" : "text-gray-400 group-hover:scale-110 group-hover:text-white"}`} />
                                <span className={isActive ? "translate-x-1 font-bold" : "group-hover:translate-x-1 transition-transform"}>{link.name}</span>
                                {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-white/10 mt-auto">
                <button className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all w-full group overflow-hidden relative">
                    <span className="flex items-center gap-3">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform group-hover:text-red-400" />
                        Tizimdan Chiqish
                    </span>
                </button>
            </div>
        </aside>
    );
}
