"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Menu,
    X,
    LogOut,
    LayoutDashboard,
    BookOpen,
    Sparkles,
    Search,
    ShieldAlert,
    Settings
} from "lucide-react";
import { CartSidebar } from "@/components/courses/cart-sidebar";

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            try {
                // Decodificación robusta de JWT para soportar caracteres especiales (UTF-8)
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);

                // Normalización de roles según estructura del backend
                const role = payload.role ||
                    (payload.roles && payload.roles[0]) ||
                    (payload.authorities && payload.authorities[0]?.authority) ||
                    "ROLE_USER";

                setIsLoggedIn(true);
                setUserRole(role);
                setUserEmail(payload.sub || "Usuario");
            } catch (e) {
                console.error("Token inválido o corrupto", e);
                handleLogout();
            }
        } else {
            setIsLoggedIn(false);
            setUserRole("");
        }
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole'); // Limpieza preventiva
        setIsLoggedIn(false);
        setUserRole("");
        setUserEmail("");

        setIsMobileMenuOpen(false);
        router.push('/login');
        router.refresh();
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md shadow-sm transition-all">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* LOGO */}
                <Link href="/courses" className="flex items-center gap-2 group">
                    <div className="bg-slate-900 p-1.5 rounded-lg group-hover:bg-slate-800 transition-colors">
                        <Sparkles className="h-5 w-5 text-amber-400 fill-amber-400" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">Lumina</span>
                </Link>

                {/* MENÚ DESKTOP */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/courses" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                        Catálogo
                    </Link>

                    {isLoggedIn ? (
                        <>
                            <Link href="/my-courses" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                                Mis Cursos
                            </Link>

                            {/* Enlaces dinámicos por Rol */}
                            {userRole === "ROLE_INSTRUCTOR" && (
                                <Link href="/instructor" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600">
                                    <LayoutDashboard size={16} />
                                    <span>Instructor</span>
                                </Link>
                            )}

                            {userRole === "ROLE_ADMIN" && (
                                <Link href="/admin" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600">
                                    <Settings size={16} />
                                    <span>Admin</span>
                                </Link>
                            )}

                            {(userRole === "ROLE_ROOT" || userRole === "ROLE_SUPER_ROOT") && (
                                <Link href="/root" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600">
                                    <ShieldAlert size={16} />
                                    <span>Root</span>
                                </Link>
                            )}

                            <CartSidebar />

                            <div className="h-6 w-px bg-slate-200 mx-2"></div>

                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500 hidden lg:inline-block font-medium max-w-[150px] truncate">
                                    {userEmail}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                                >
                                    <LogOut size={16} />
                                    <span className="hidden xl:inline">Salir</span>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" asChild className="text-slate-700">
                                <Link href="/login">Ingresar</Link>
                            </Button>
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white" asChild>
                                <Link href="/register">Registro</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* BOTONES MÓVIL */}
                <div className="md:hidden flex items-center gap-2">
                    {isLoggedIn && <CartSidebar />}
                    <button
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* MENÚ MÓVIL DESPLEGABLE */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t bg-white p-4 space-y-4 shadow-lg absolute w-full left-0 top-16 animate-in slide-in-from-top-2">
                    <Link href="/courses" className="flex items-center gap-2 text-slate-700 py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                        <Search size={18}/> Catálogo
                    </Link>

                    {isLoggedIn ? (
                        <>
                            <Link href="/my-courses" className="flex items-center gap-2 text-slate-700 py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                <BookOpen size={18}/> Mis Cursos
                            </Link>

                            {userRole === "ROLE_INSTRUCTOR" && (
                                <Link href="/instructor" className="flex items-center gap-2 text-purple-700 py-2 bg-purple-50 rounded px-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                    <LayoutDashboard size={18}/> Panel Instructor
                                </Link>
                            )}
                            {userRole === "ROLE_ADMIN" && (
                                <Link href="/admin" className="flex items-center gap-2 text-blue-700 py-2 bg-blue-50 rounded px-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Settings size={18}/> Panel Admin
                                </Link>
                            )}
                            {(userRole === "ROLE_ROOT" || userRole === "ROLE_SUPER_ROOT") && (
                                <Link href="/root" className="flex items-center gap-2 text-red-700 py-2 bg-red-50 rounded px-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                    <ShieldAlert size={18}/> Panel Root
                                </Link>
                            )}

                            <div className="border-t pt-4 mt-2">
                                <p className="text-xs text-slate-400 mb-2 px-2 truncate">{userEmail}</p>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-red-600 w-full px-2 py-2 hover:bg-red-50 rounded font-medium text-left"
                                >
                                    <LogOut size={18}/> Cerrar Sesión
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-3 pt-2 border-t mt-2">
                            <Button variant="outline" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                                <Link href="/login">Ingresar</Link>
                            </Button>
                            <Button className="w-full bg-slate-900 text-white" asChild onClick={() => setIsMobileMenuOpen(false)}>
                                <Link href="/register">Registrarse</Link>
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
