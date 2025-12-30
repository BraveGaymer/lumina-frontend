"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Package,
    Ticket,
    Activity,
    LogOut,
    Menu,
    X,
    Loader2,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- 1. LÓGICA DE PROTECCIÓN (Cliente) ---
    useEffect(() => {
        // Esta lógica es segura porque ocurre en el navegador del usuario
        const token = localStorage.getItem("jwtToken");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            // Decodificamos el JWT para ver el rol
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            const role = payload.role || (payload.roles && payload.roles[0]);

            if (role === "ROLE_ADMIN" || role === "ROLE_SUPER_ROOT") {
                setIsAuthorized(true);
            } else {
                toast.error("Acceso denegado. Área restringida.");
                router.push("/courses"); // O a donde quieras enviar a los intrusos
            }
        } catch (error) {
            console.error("Error validando token:", error);
            localStorage.removeItem("jwtToken");
            router.push("/login");
        }
    }, [router]);

    // --- 2. FUNCIÓN DE LOGOUT ---
    const handleLogout = () => {
        localStorage.removeItem("jwtToken");
        // localStorage.removeItem("userRole"); // Opcional si lo usas
        toast.info("Sesión cerrada");
        router.push("/login");
    };

    // --- 3. MENÚ DE NAVEGACIÓN ---
    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Usuarios", href: "/admin/users", icon: Users },
        { name: "Paquetes", href: "/admin/bundles", icon: Package },
        { name: "Cupones", href: "/admin/coupons", icon: Ticket },
        { name: "Monitoreo", href: "/admin/monitoring", icon: Activity },
    ];

    // --- 4. RENDERIZADO DE CARGA ---
    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-500">
                <Loader2 className="animate-spin h-10 w-10 mb-4 text-emerald-600"/>
                <p className="font-medium animate-pulse">Verificando credenciales de administrador...</p>
            </div>
        );
    }

    // --- 5. RENDERIZADO PRINCIPAL (SHELL) ---
    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* --- SIDEBAR DESKTOP --- */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-slate-300 fixed inset-y-0 left-0 z-50 border-r border-slate-800">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                    <Sparkles className="h-6 w-6 text-emerald-500 mr-2" />
                    <span className="font-bold text-white tracking-wide text-lg">Lumina Admin</span>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                                        : "hover:bg-slate-800 hover:text-white"
                                }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 z-40 flex items-center justify-between px-4 shadow-md">
                <div className="flex items-center gap-2 text-white font-bold">
                    <Sparkles className="h-5 w-5 text-emerald-500" /> Admin Panel
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* --- MOBILE MENU --- */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-slate-950/95 pt-20 px-6 animate-in fade-in duration-200">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium ${
                                    pathname === item.href ? "bg-emerald-600 text-white" : "text-slate-300"
                                }`}
                            >
                                <item.icon className="h-6 w-6" />
                                {item.name}
                            </Link>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-4 px-4 py-4 w-full text-lg font-medium text-red-400 mt-8 border-t border-slate-800 pt-8"
                        >
                            <LogOut className="h-6 w-6" /> Cerrar Sesión
                        </button>
                    </nav>
                </div>
            )}

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-64 transition-all duration-300 min-h-screen pt-16 md:pt-0">
                <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>

        </div>
    );
}