"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    UserPlus,
    ShieldAlert,
    LogOut,
    Menu,
    X,
    Loader2,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- 1. LÓGICA DE PROTECCIÓN ESTRICTA ---
    useEffect(() => {
        const token = localStorage.getItem("jwtToken");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            // Decodificación segura
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            const role = payload.role || (payload.roles && payload.roles[0]);

            // SOLO ROLE_SUPER_ROOT
            if (role === "ROLE_SUPER_ROOT") {
                setIsAuthorized(true);
            } else {
                toast.error("Zona restringida: Nivel Root requerido.");
                // Si es admin normal, lo mandamos a su panel, si no, al login
                if (role === "ROLE_ADMIN") {
                    router.push("/admin");
                } else {
                    router.push("/login");
                }
            }
        } catch (error) {
            console.error("Error de autenticación:", error);
            localStorage.removeItem("jwtToken");
            router.push("/login");
        }
    }, [router]);

    // --- 2. LOGOUT ---
    const handleLogout = () => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userRole");
        toast.info("Sesión Root cerrada");
        router.push("/login");
    };

    // --- 3. MENÚ DE NAVEGACIÓN ROOT ---
    const navItems = [
        { name: "Root Dashboard", href: "/root", icon: LayoutDashboard },
        { name: "Solicitudes Admin", href: "/root/requests", icon: ShieldAlert },
        { name: "Crear Usuario", href: "/root/create-user", icon: UserPlus },
    ];

    // --- 4. SPINNER DE CARGA ---
    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
                <Loader2 className="animate-spin h-10 w-10 mb-4 text-red-600"/>
                <p className="font-mono text-sm animate-pulse">Verificando privilegios Root...</p>
            </div>
        );
    }

    // --- 5. RENDERIZADO DEL SHELL ---
    return (
        <div className="min-h-screen bg-slate-950 flex">

            {/* SIDEBAR DESKTOP */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 fixed inset-y-0 left-0 z-50 border-r border-slate-800">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
                    <Shield className="h-6 w-6 text-red-500 mr-2" />
                    <span className="font-bold text-white tracking-wide text-lg">God Mode</span>
                </div>

                {/* Enlaces */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                    isActive
                                        ? "bg-red-600/10 text-red-500 border border-red-900/50"
                                        : "hover:bg-slate-800 hover:text-white"
                                }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? "text-red-500" : "text-slate-500"}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center justify-between px-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold">
                    <Shield className="h-5 w-5 text-red-500" /> Root Panel
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:bg-slate-800">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* MOBILE MENU */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-slate-950/95 pt-20 px-6 backdrop-blur-sm animate-in fade-in">
                    <nav className="space-y-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium border ${
                                    pathname === item.href
                                        ? "bg-red-900/20 border-red-900 text-red-400"
                                        : "border-transparent text-slate-300 hover:bg-slate-900"
                                }`}
                            >
                                <item.icon className="h-6 w-6" />
                                {item.name}
                            </Link>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-4 px-4 py-4 w-full text-lg font-medium text-slate-400 mt-8 border-t border-slate-800 pt-8"
                        >
                            <LogOut className="h-6 w-6" /> Cerrar Sesión
                        </button>
                    </nav>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 md:ml-64 transition-all duration-300 min-h-screen pt-16 md:pt-0">
                {/* Fondo sutil para diferenciar el área root */}
                <div className="h-full bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                    {children}
                </div>
            </main>

        </div>
    );
}
