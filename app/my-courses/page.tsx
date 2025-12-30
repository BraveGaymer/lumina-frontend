"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, FileText, ShoppingBag, ArrowRight, Sparkles, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// --- TIPOS ---
interface Inscription {
    inscriptionId: string;
    cursoId: string;
    cursoTitulo: string;
    usuarioId: string;
    usuarioNombre: string;
    fechaInscripcion: string;
    estado: string;
    cursoPortadaUrl?: string;
}

export default function MyCoursesPage() {
    const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();

    // --- CARGA DE DATOS (Con Axios) ---
    useEffect(() => {
        const fetchMyCourses = async () => {
            // Verificación rápida de sesión
            if (!localStorage.getItem('jwtToken')) {
                router.push('/login');
                return;
            }

            try {
                // Axios gestiona la URL y el Token
                const response = await api.get('/inscripciones/mis-cursos');

                // Axios devuelve los datos directamente en .data
                setInscriptions(response.data);

            } catch (err: any) {
                console.error(err);
                if (err.response && err.response.status === 401) {
                    toast.error("Sesión expirada.");
                    router.push('/login');
                } else {
                    toast.error("No pudimos cargar tus cursos.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyCourses();
    }, [router]);

    // --- FILTRADO (Solo activas) ---
    const activeCourses = inscriptions.filter(i => i.estado === 'ACTIVA');

    if (isLoading) return <div className="flex justify-center items-center h-screen text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando tus cursos...</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-7xl min-h-screen">

            {/* CABECERA */}
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-amber-100 p-2 rounded-xl">
                    <BookOpen className="h-8 w-8 text-amber-600" aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Mis Cursos</h1>
                    <p className="text-slate-500 text-sm">Continúa tu aprendizaje donde lo dejaste.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- COLUMNA IZQUIERDA: CURSOS (Principal) --- */}
                <div className="flex-1">
                    {activeCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeCourses.map(inscription => (
                                <Link
                                    href={`/learn/${inscription.cursoId}`}
                                    key={inscription.inscriptionId}
                                    className="group block bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden hover:-translate-y-1"
                                    aria-label={`Ir al curso: ${inscription.cursoTitulo}`}
                                >
                                    {/* ZONA DE IMAGEN */}
                                    <div className="h-44 relative overflow-hidden bg-slate-100">
                                        {inscription.cursoPortadaUrl ? (
                                            <img
                                                src={inscription.cursoPortadaUrl}
                                                alt=""
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            // Fallback Estilo Lumina
                                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-amber-400">
                                                <Sparkles className="h-10 w-10 mb-2 opacity-80" aria-hidden="true" />
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lumina Learning</span>
                                            </div>
                                        )}

                                        {/* Overlay al hacer hover */}
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-300" />
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-lg font-bold mb-3 text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-2 leading-tight">
                                            {inscription.cursoTitulo}
                                        </h3>

                                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Inscrito el</span>
                                                <span className="text-xs text-slate-600 font-medium">
                                                    {new Date(inscription.fechaInscripcion).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <span className="text-slate-900 text-sm font-bold flex items-center group-hover:underline decoration-amber-500 underline-offset-4">
                                                Continuar <ArrowRight className="ml-1 h-4 w-4 text-amber-500 group-hover:translate-x-1 transition-transform"/>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        // Estado Vacío
                        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
                                <GraduationCap className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Aún no tienes cursos activos</h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                Tu biblioteca está vacía. Explora nuestro catálogo y empieza tu primera aventura de aprendizaje hoy.
                            </p>
                            <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white">
                                <Link href="/courses">Explorar Catálogo</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* --- COLUMNA DERECHA: BARRA LATERAL --- */}
                <aside className="w-full lg:w-80 shrink-0 space-y-6">

                    {/* Tarjeta de Menú Rápido */}
                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-base font-bold text-slate-800">Tu Cuenta</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            {/* Botón Historial de Compras */}
                            <Button
                                variant="outline"
                                className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 h-12 font-medium"
                                asChild
                            >
                                <Link href="/purchases" aria-label="Ver historial de compras">
                                    <FileText className="mr-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                                    Historial de Compras
                                </Link>
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50 h-12"
                                asChild
                            >
                                <Link href="/courses">
                                    <ShoppingBag className="mr-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                                    Explorar más cursos
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Banner Promocional Estilo Lumina */}
                    <div className="bg-slate-900 rounded-xl p-6 text-white text-center shadow-lg relative overflow-hidden group">
                        {/* Decoración de fondo */}
                        <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-white/5 group-hover:rotate-12 transition-transform duration-700" />

                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-2 text-amber-400">¿Buscas algo nuevo?</h4>
                            <p className="text-slate-300 text-sm mb-5 leading-relaxed">
                                Descubre los cursos más recientes agregados a la plataforma este mes.
                            </p>
                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold border-0" asChild>
                                <Link href="/courses">Ver Novedades</Link>
                            </Button>
                        </div>
                    </div>

                </aside>

            </div>
        </div>
    );
}