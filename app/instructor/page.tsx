"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    PlusCircle,
    BarChart3,
    BookOpen,
    Users,
    Loader2,
    Sparkles,
    MoreVertical,
    FileEdit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// --- TIPOS ---
interface MyCourse {
    id: string;
    titulo: string;
    descripcion: string;
    estado: boolean; // true = publicado, false = borrador
    portadaUrl?: string;
}

export default function InstructorDashboard() {
    const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // --- CARGA DE DATOS (Con Axios) ---
    useEffect(() => {
        const fetchData = async () => {
            // Verificación rápida de sesión antes de la petición
            if (!localStorage.getItem('jwtToken')) {
                router.push('/login');
                return;
            }

            try {
                // Axios gestiona la URL base y el Bearer Token automáticamente
                const response = await api.get('/instructor/my-courses');

                // Axios devuelve los datos directamente en .data
                setMyCourses(response.data);

            } catch (err: any) {
                console.error(err);
                if (err.response && err.response.status === 403) {
                    toast.error("Acceso denegado. Área exclusiva para instructores.");
                } else {
                    toast.error("Error al cargar tus cursos.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [router]);

    if (isLoading) return <div className="flex justify-center items-center h-screen text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando panel...</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-7xl min-h-screen">

            {/* CABECERA */}
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-slate-900 p-2 rounded-xl shadow-md">
                    <LayoutDashboard className="h-8 w-8 text-amber-400" aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Panel de Instructor</h1>
                    <p className="text-slate-500 text-sm">Gestiona tus cursos y monitorea tu progreso.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- COLUMNA IZQUIERDA: CURSOS --- */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Mis Cursos</h2>
                        <span className="text-sm text-slate-500">{myCourses.length} cursos creados</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* 1. TARJETA ESPECIAL: CREAR NUEVO CURSO */}
                        {/* Corregido: Apunta a /instructor/create-course */}
                        <Link href="/create-course" className="group block h-full" aria-label="Crear un nuevo curso">
                            <div className="h-full border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer min-h-[200px]">
                                <div className="bg-slate-100 p-4 rounded-full mb-3 group-hover:bg-slate-200 transition-colors">
                                    <PlusCircle className="h-8 w-8 group-hover:scale-110 transition-transform"/>
                                </div>
                                <span className="font-bold text-lg">Crear Nuevo Curso</span>
                                <span className="text-xs text-slate-400 mt-1">Comienza una nueva aventura</span>
                            </div>
                        </Link>

                        {/* 2. LISTA DE CURSOS EXISTENTES */}
                        {myCourses.map(curso => (
                            <Link
                                href={`/instructor/courses/${curso.id}`}
                                key={curso.id}
                                className="block group h-full"
                                aria-label={`Gestionar curso: ${curso.titulo}`}
                            >
                                <Card className="h-full hover:shadow-xl transition-all border-slate-200 group-hover:border-slate-300 overflow-hidden hover:-translate-y-1">
                                    <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
                                        <div className="flex justify-between items-start gap-2">
                                            <Badge
                                                variant={curso.estado ? "default" : "secondary"}
                                                className={curso.estado
                                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"
                                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
                                                }
                                            >
                                                {curso.estado ? 'Publicado' : 'Borrador'}
                                            </Badge>
                                            <div className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                                                <MoreVertical className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg mt-3 line-clamp-2 group-hover:text-amber-600 transition-colors leading-tight">
                                            {curso.titulo}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <p className="text-sm text-slate-500 line-clamp-3 mb-4 min-h-[3rem]">
                                            {curso.descripcion || "Sin descripción..."}
                                        </p>
                                        <div className="flex items-center text-xs text-slate-400 font-medium group-hover:text-slate-600 transition-colors">
                                            <FileEdit className="h-3 w-3 mr-1" />
                                            Click para editar contenido
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* --- COLUMNA DERECHA: SIDEBAR DE HERRAMIENTAS --- */}
                <aside className="w-full lg:w-80 shrink-0 space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-bold text-slate-800">Herramientas</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">

                            {/* REPORTES */}
                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200"
                                asChild
                            >
                                <Link href="/instructor/reportes/mis-ventas">
                                    <BarChart3 className="mr-3 h-5 w-5 text-slate-400" />
                                    Reporte de Ventas
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start h-12 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200"
                                asChild
                            >
                                <Link href="/instructor/reportes/estudiantes">
                                    <Users className="mr-3 h-5 w-5 text-slate-400" />
                                    Estudiantes Activos
                                </Link>
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full justify-start h-12 text-slate-400 cursor-not-allowed hover:bg-transparent"
                                disabled
                                aria-disabled="true"
                            >
                                <BookOpen className="mr-3 h-5 w-5 text-slate-300" />
                                Guía del Instructor (Pronto)
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Resumen Rápido Estilo Lumina */}
                    <div className="bg-slate-900 rounded-xl p-6 text-white text-center shadow-lg relative overflow-hidden group">
                        <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-white/5 group-hover:rotate-12 transition-transform duration-700" />

                        <div className="relative z-10">
                            <h4 className="font-bold text-3xl mb-1 text-amber-400">{myCourses.length}</h4>
                            <p className="text-slate-300 text-sm font-medium uppercase tracking-wide mb-4">Cursos Creados</p>
                            <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                                ¡Sigue impactando vidas con tu conocimiento!
                            </div>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}
