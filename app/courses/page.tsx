"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Loader2, BookOpen, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión segura

// --- INTERFACES ---
interface Course {
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    categorias: string[];
    nombreInstructor: string;
    promedioCalificacion?: number;
    totalResenas?: number;
    portadaUrl?: string;
}

interface Category {
    id: number;
    nombre: string;
}

// --- COMPONENTE DE CONTENIDO ---
function CatalogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. Leer filtros de la URL
    const currentSearch = searchParams.get("q") || "";
    const currentCat = searchParams.get("cat") || "";

    // 2. Estados locales
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(currentSearch);

    // --- EFECTO 1: Cargar Categorías (Con Axios) ---
    useEffect(() => {
        // Axios se encarga de completar la URL (http://.../api/categorias)
        api.get("/categorias")
            .then((res) => setCategories(res.data)) // En axios los datos están en .data
            .catch(() => toast.error("No se pudieron cargar las categorías."));
    }, []);

    // --- EFECTO 2: Buscar Cursos (Con Axios) ---
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                // Preparamos los parámetros de búsqueda de forma limpia
                const params: any = {};
                if (currentSearch && currentSearch.trim() !== "") {
                    params.q = currentSearch;
                }
                if (currentCat && currentCat.trim() !== "") {
                    params.cat = currentCat;
                }

                // Axios maneja la construcción de la query string (?q=...&cat=...)
                const res = await api.get("/cursos/buscar", { params });

                setCourses(res.data);

            } catch (error: any) {
                // Manejo de errores específico
                if (error.response && error.response.status === 404) {
                    setCourses([]); // Si es 404, simplemente no hay resultados
                } else {
                    console.error("Error cargando cursos:", error);
                    toast.error("Error al cargar el catálogo.");
                    setCourses([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
        setSearchTerm(currentSearch);

    }, [currentSearch, currentCat]);

    // --- MANEJADORES ---
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateUrl(searchTerm, currentCat);
    };

    const handleCategoryClick = (catName: string) => {
        const newCat = currentCat === catName ? "" : catName;
        updateUrl(searchTerm, newCat);
    };

    const updateUrl = (q: string, cat: string) => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (cat) params.set("cat", cat);
        router.push(`/courses?${params.toString()}`);
    };

    return (
        <div className="container mx-auto p-4 lg:p-8 min-h-screen">

            {/* CABECERA */}
            <div className="mb-8 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="bg-amber-100 p-2 rounded-lg">
                        <BookOpen className="h-6 w-6 text-amber-600" aria-hidden="true" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Catálogo de Cursos</h1>
                </div>
                <p className="text-slate-500 max-w-2xl">
                    Descubre conocimientos nuevos y potencia tus habilidades con nuestra selección premium.
                </p>

                {/* BARRA DE BÚSQUEDA */}
                <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" aria-hidden="true"/>
                        <Input
                            placeholder="Buscar por nombre, tema o instructor..."
                            className="pl-10 border-slate-300 focus-visible:ring-amber-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Buscar cursos"
                        />
                    </div>
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
                        Buscar
                    </Button>
                </form>
            </div>

            <div className="flex flex-col md:flex-row gap-8">

                {/* SIDEBAR FILTROS */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold border-b pb-2">
                            <Filter size={18} aria-hidden="true"/>
                            <span>Categorías</span>
                        </div>

                        <div className="space-y-1" role="group" aria-label="Filtros de categoría">
                            <button
                                onClick={() => handleCategoryClick("")}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                    !currentCat
                                        ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-500"
                                        : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                                }`}
                                aria-pressed={!currentCat}
                            >
                                Ver Todo
                            </button>

                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.nombre)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                        currentCat === cat.nombre
                                            ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-500"
                                            : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                                    }`}
                                    aria-pressed={currentCat === cat.nombre}
                                >
                                    {cat.nombre}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* GRID DE RESULTADOS */}
                <main className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="animate-spin h-10 w-10 mb-2"/>
                            <p>Cargando cursos...</p>
                        </div>
                    ) : courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <Card
                                    key={course.id}
                                    className="flex flex-col hover:shadow-xl transition-all duration-300 border-slate-200 overflow-hidden cursor-pointer group h-full hover:-translate-y-1"
                                    onClick={() => router.push(`/courses/${course.id}`)}
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/courses/${course.id}`); }}
                                    aria-label={`Ver detalles del curso ${course.titulo}`}
                                >
                                    {/* ZONA DE IMAGEN DE PORTADA */}
                                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                                        {course.portadaUrl ? (
                                            <img
                                                src={course.portadaUrl}
                                                alt={`Portada del curso ${course.titulo}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            // Fallback Estilo Lumina
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-amber-400">
                                                <Sparkles size={40} className="mb-2 opacity-80"/>
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Lumina</span>
                                            </div>
                                        )}

                                        {/* Precio Flotante */}
                                        <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded text-sm font-bold shadow-sm text-white border border-slate-700">
                                            ${course.precio.toFixed(2)}
                                        </div>
                                    </div>

                                    <CardHeader className="pb-2 pt-4 px-5">
                                        {/* ETIQUETAS */}
                                        <div className="flex flex-wrap gap-2 mb-2 items-center">
                                            {/* Calificación */}
                                            {course.promedioCalificacion && course.promedioCalificacion > 0 ? (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 px-2 py-0.5">
                                                    <Star size={10} fill="currentColor" />
                                                    {course.promedioCalificacion}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-400 border-dashed border-slate-300 text-[10px] px-2">
                                                    Nuevo
                                                </Badge>
                                            )}

                                            {/* Categorías */}
                                            {course.categorias.slice(0, 2).map((cat, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-[10px] px-2 bg-slate-100 text-slate-700 hover:bg-slate-200">
                                                    {cat}
                                                </Badge>
                                            ))}
                                        </div>

                                        <CardTitle className="text-lg font-bold leading-tight line-clamp-2 min-h-[3.5rem] text-slate-900 group-hover:text-amber-600 transition-colors">
                                            {course.titulo}
                                        </CardTitle>
                                        <p className="text-xs text-slate-500 font-medium">Instructor: {course.nombreInstructor}</p>
                                    </CardHeader>

                                    <CardContent className="flex-1 px-5">
                                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                            {course.descripcion}
                                        </p>
                                    </CardContent>

                                    <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 pb-5 px-5 bg-slate-50/50 mt-auto">
                                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                            <BookOpen size={12} /> {course.totalResenas || 0} reseñas
                                        </span>
                                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-medium h-8">
                                            Ver Detalles
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        // Estado Vacío
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
                                <Search className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No encontramos cursos</h3>
                            <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
                                Intenta buscar con otros términos o limpia los filtros.
                            </p>
                            <Button
                                variant="link"
                                onClick={() => updateUrl("", "")}
                                className="mt-4 text-amber-600 hover:text-amber-700 font-semibold"
                            >
                                Limpiar filtros
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function CoursesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Cargando catálogo...
            </div>
        }>
            <CatalogContent />
        </Suspense>
    );
}