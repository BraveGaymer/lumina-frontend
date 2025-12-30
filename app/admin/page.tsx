"use client";

import React from "react";
import Link from "next/link";
import {
    Users,
    Package,
    Ticket,
    Activity,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {

    // --- MÓDULOS DE GESTIÓN ---
    // Este archivo es seguro: Solo contiene navegación estática.
    const modules = [
        {
            title: "Gestión de Usuarios",
            description: "Administrar roles (User/Instructor) y bloquear/activar cuentas.",
            icon: <Users className="h-8 w-8 text-slate-600" />,
            href: "/admin/users",
            borderColor: "hover:border-slate-400"
        },
        {
            title: "Paquetes (Bundles)",
            description: "Crear agrupaciones de cursos con precios especiales.",
            icon: <Package className="h-8 w-8 text-purple-500" />,
            href: "/admin/bundles",
            borderColor: "hover:border-purple-400"
        },
        {
            title: "Cupones de Descuento",
            description: "Generar códigos promocionales para campañas.",
            icon: <Ticket className="h-8 w-8 text-emerald-500" />,
            href: "/admin/coupons",
            borderColor: "hover:border-emerald-400"
        },
        {
            title: "Monitoreo y Auditoría",
            description: "Ver historial de transacciones y logs de actividad.",
            icon: <Activity className="h-8 w-8 text-orange-500" />,
            href: "/admin/monitoring",
            borderColor: "hover:border-orange-400"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* CABECERA SIMPLE */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
                    <p className="text-slate-500">Bienvenido de nuevo, Administrador.</p>
                </div>
            </div>

            <div className="border-t border-slate-200 my-6"></div>

            {/* GRID DE MÓDULOS */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Módulos de Gestión</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((module, index) => (
                        <Link href={module.href} key={index} className="group block h-full">
                            <Card className={`h-full cursor-pointer border-slate-200 transition-all duration-300 hover:shadow-xl border-l-4 border-l-transparent ${module.borderColor} hover:-translate-y-1`}>
                                <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                                        {module.icon}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-lg font-bold text-slate-800 mb-2 group-hover:text-slate-900">
                                        {module.title}
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 text-sm mb-4 line-clamp-2">
                                        {module.description}
                                    </CardDescription>
                                    <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-900 transition-colors">
                                        Acceder <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}