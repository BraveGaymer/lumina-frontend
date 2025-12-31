"use client";

import React from "react";
import Link from "next/link";
import {
    ShieldAlert,
    UserPlus,
    FileText,
    Settings,
    ArrowRight,
    Activity,
    Server,
    Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SuperRootHub() {

    // Simulación de estado del sistema (Podrías conectarlo con una API real luego)
    const systemStatus = {
        status: "OPERATIVO",
        admins: "Activos",
        uptime: "99.9%"
    };

    const modules = [
        {
            title: "Solicitudes de Acceso",
            description: "Aprobar o rechazar nuevos candidatos a Administradores.",
            icon: <ShieldAlert className="h-8 w-8 text-red-500" />,
            href: "/root/requests", // Enlace corregido para coincidir con tu archivo
            borderColor: "hover:border-red-500/50",
            bgColor: "bg-red-500/10",
            active: true
        },
        {
            title: "Creación Manual",
            description: "Dar de alta usuarios Administradores o Instructores directamente.",
            icon: <UserPlus className="h-8 w-8 text-blue-500" />,
            href: "/root/create-user", // Enlace corregido para coincidir con tu archivo
            borderColor: "hover:border-blue-500/50",
            bgColor: "bg-blue-500/10",
            active: true
        },
        {
            title: "Auditoría Global",
            description: "Logs críticos de seguridad y accesos al sistema.",
            icon: <FileText className="h-8 w-8 text-slate-500" />,
            href: "#",
            borderColor: "hover:border-slate-600",
            bgColor: "bg-slate-800/50",
            active: false
        },
        {
            title: "Configuración del Sistema",
            description: "Variables de entorno, mantenimiento y llaves de seguridad.",
            icon: <Settings className="h-8 w-8 text-slate-500" />,
            href: "#",
            borderColor: "hover:border-slate-600",
            bgColor: "bg-slate-800/50",
            active: false
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 md:p-12">
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">

                {/* HEADER DE COMANDO */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
                    <div className="flex items-center gap-5">
                        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <Lock className="h-10 w-10 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white tracking-tight">Super Root Control</h1>
                            <p className="text-slate-400 mt-1 flex items-center gap-2">
                                <Badge variant="outline" className="text-red-400 border-red-900 bg-red-950/30">Nivel 0</Badge>
                                Acceso Total al Sistema
                            </p>
                        </div>
                    </div>

                    {/* STATUS WIDGET */}
                    <div className="flex gap-4 md:gap-8 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
                        <div className="text-center px-2">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                                <Activity size={12}/> Estado
                            </p>
                            <span className="text-emerald-400 font-mono font-bold">{systemStatus.status}</span>
                        </div>
                        <div className="w-px bg-slate-800 h-10"></div>
                        <div className="text-center px-2">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                                <ShieldAlert size={12}/> Admins
                            </p>
                            <span className="text-white font-mono font-bold">{systemStatus.admins}</span>
                        </div>
                        <div className="w-px bg-slate-800 h-10"></div>
                        <div className="text-center px-2">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                                <Server size={12}/> Uptime
                            </p>
                            <span className="text-blue-400 font-mono font-bold">{systemStatus.uptime}</span>
                        </div>
                    </div>
                </div>

                {/* GRID DE MÓDULOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((module, index) => (
                        <Link
                            href={module.href}
                            key={index}
                            className={`group block h-full ${!module.active ? 'pointer-events-none opacity-60' : ''}`}
                        >
                            <Card className={`h-full bg-slate-900 border-slate-800 transition-all duration-300 hover:shadow-2xl hover:bg-slate-800/80 border-l-4 border-l-transparent ${module.borderColor} relative overflow-hidden`}>
                                {/* Efecto de brillo en hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xl font-bold text-white group-hover:text-slate-100">
                                        {module.title}
                                    </CardTitle>
                                    <div className={`p-3 rounded-lg ${module.bgColor} transition-colors`}>
                                        {module.icon}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="mt-2 mb-6 text-slate-400 text-base">
                                        {module.description}
                                    </CardDescription>

                                    <div className="flex items-center justify-end">
                                        {module.active ? (
                                            <span className="flex items-center text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                                                Acceder <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </span>
                                        ) : (
                                            <Badge variant="secondary" className="bg-slate-800 text-slate-500 border-slate-700">Próximamente</Badge>
                                        )}
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
