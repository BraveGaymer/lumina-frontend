"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    Save,
    ArrowLeft,
    X,
    Plus,
    Trash2,
    Image as ImageIcon,
    AlertTriangle,
    PenTool
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

import CourseModules from "@/components/courses/course-modules";

interface CourseDetail {
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    categorias: string[];
    portadaUrl?: string;
}

interface Category {
    id: number;
    nombre: string;
}

export default function ManageCoursePage() {
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precio, setPrecio] = useState("");

    const [portadaUrl, setPortadaUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const [catInput, setCatInput] = useState("");
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [existingCats, setExistingCats] = useState<Category[]>([]);
    const [suggestions, setSuggestions] = useState<Category[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const params = useParams();
    const courseId = params?.courseId as string;

    // --- CARGA INICIAL (Con Axios y Promise.all) ---
    const fetchInitialData = useCallback(async () => {
        if (!courseId) return;

        // Verificación rápida de sesión
        if (!localStorage.getItem('jwtToken')) { router.push('/login'); return; }

        try {
            // Cargamos categorías y curso al mismo tiempo
            const [catsRes, courseRes] = await Promise.all([
                api.get('/categorias'),
                api.get(`/cursos/${courseId}`)
            ]);

            // 1. Categorías
            setExistingCats(catsRes.data);

            // 2. Curso
            const data = courseRes.data;
            setCourse(data);

            // Rellenar formulario si está vacío
            if (!titulo) {
                setTitulo(data.titulo);
                setDescripcion(data.descripcion);
                setPrecio(String(data.precio));
                setPortadaUrl(data.portadaUrl || "");
                if (data.categorias) {
                    setSelectedCats(data.categorias.map((c: string) => normalize(c)));
                }
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 404) {
                toast.error("El curso no existe.");
                router.push('/instructor');
            } else {
                toast.error("Error al cargar la información.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [courseId, router, titulo]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    // --- SUBIDA DE IMAGEN (Con Axios) ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Axios maneja el multipart automáticamente
            const res = await api.post("/media/upload", formData);

            setPortadaUrl(res.data.url);
            toast.success("Portada actualizada correctamente");

        } catch (error) {
            console.error(error);
            toast.error("Error al subir la imagen.");
        } finally {
            setUploading(false);
        }
    };

    // --- CATEGORÍAS ---
    const normalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    const handleCatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCatInput(val);
        setShowDropdown(true);

        if (val.trim().length > 0) {
            const filtered = existingCats.filter(c =>
                c.nombre.toLowerCase().includes(val.toLowerCase()) &&
                !selectedCats.includes(c.nombre)
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]); setShowDropdown(false);
        }
    };

    const addCategory = (name: string) => {
        const normalizedName = normalize(name.trim());
        if (!normalizedName) return;
        if (selectedCats.includes(normalizedName)) {
            setCatInput(""); setShowDropdown(false); return;
        }
        setSelectedCats([...selectedCats, normalizedName]);
        setCatInput(""); setSuggestions([]); setShowDropdown(false);
    };

    const removeCategory = (nameToRemove: string) => {
        setSelectedCats(selectedCats.filter(c => c !== nameToRemove));
    };

    const handleCatKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); if (catInput.trim()) addCategory(catInput); }
    };

    // --- GUARDAR CAMBIOS (PUT con Axios) ---
    const handleUpdateCourse = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);

        const payload = {
            titulo,
            descripcion,
            precio: parseFloat(precio) || 0,
            categorias: selectedCats,
            portadaUrl
        };

        try {
            await api.put(`/cursos/${courseId}`, payload);

            toast.success("¡Curso actualizado!", {
                description: "Los cambios ya son visibles para los estudiantes."
            });
            setCourse({ ...course!, ...payload } as CourseDetail);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                toast.error(err.response.data.error || "Error al actualizar.");
            } else {
                toast.error("Error de conexión.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    // --- ELIMINAR CURSO (DELETE con Axios) ---
    const handleDeleteCourse = async () => {
        if (!window.confirm("⚠️ ¿Estás SEGURO de eliminar este curso?\n\nEsta acción es irreversible.")) {
            return;
        }

        setIsDeleting(true);

        try {
            await api.delete(`/cursos/${courseId}`);

            toast.success("Curso eliminado correctamente.");
            router.push('/instructor');

        } catch (err: any) {
            console.error(err);
            toast.error("No se pudo eliminar el curso. Asegúrate de que no tenga estudiantes inscritos.");
            setIsDeleting(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando editor...</div>;
    if (!course) return <div className="p-10 text-center text-slate-500">Curso no encontrado o no tienes permisos.</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-7xl min-h-screen">

            {/* CABECERA */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <Button variant="ghost" size="icon" asChild className="hover:bg-slate-100 text-slate-500 hover:text-slate-900">
                    <Link href="/instructor" aria-label="Volver al panel de instructor"><ArrowLeft size={20}/></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <PenTool className="h-6 w-6 text-amber-500" />
                        Gestionar Contenido
                    </h1>
                    <p className="text-slate-500 text-sm">Estás editando: <span className="font-medium text-slate-700">{course.titulo}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- COLUMNA IZQUIERDA: DETALLES GENERALES --- */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-md border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg font-bold text-slate-800">Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleUpdateCourse} className="space-y-5">

                                {/* PORTADA */}
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Portada</Label>
                                    {portadaUrl ? (
                                        <div className="relative w-full h-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                                            <img
                                                src={portadaUrl}
                                                alt="Portada del curso"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setPortadaUrl("")}
                                                    className="bg-white text-red-600 px-3 py-1.5 text-xs rounded-full font-bold shadow hover:bg-red-50 flex items-center gap-1"
                                                >
                                                    <X size={14} /> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all group">
                                                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                                    {uploading ? (
                                                        <Loader2 className="animate-spin text-slate-900 h-6 w-6" />
                                                    ) : (
                                                        <>
                                                            <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                                <ImageIcon className="h-5 w-5 text-slate-500" />
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-medium">Click para subir</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    disabled={uploading}
                                                    onChange={handleImageUpload}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Título</Label>
                                    <Input value={titulo} onChange={e => setTitulo(e.target.value)} required className="border-slate-200 focus-visible:ring-amber-500"/>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Descripción</Label>
                                    <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="min-h-[100px] border-slate-200 focus-visible:ring-amber-500 resize-none text-sm"/>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Precio ($)</Label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={precio}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "" || /^\d+(\.\d{0,2})?$/.test(val)) setPrecio(val);
                                        }}
                                        className="border-slate-200 focus-visible:ring-amber-500 font-mono"
                                    />
                                </div>

                                {/* CATEGORÍAS */}
                                <div className="space-y-3 relative">
                                    <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Categorías</Label>
                                    <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                                        {selectedCats.map((cat, idx) => (
                                            <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                                {cat}
                                                <button type="button" onClick={() => removeCategory(cat)} className="hover:text-red-600 transition-colors">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Añadir..."
                                                value={catInput}
                                                onChange={handleCatInputChange}
                                                onKeyDown={handleCatKeyDown}
                                                onFocus={() => { if(catInput) setShowDropdown(true) }}
                                                autoComplete="off"
                                                className="h-9 text-sm border-slate-200 focus-visible:ring-amber-500"
                                            />
                                            <Button type="button" size="sm" variant="outline" onClick={() => addCategory(catInput)} disabled={!catInput.trim()}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {showDropdown && catInput.trim().length > 0 && (
                                            <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-xl mt-1 max-h-60 overflow-auto">
                                                {suggestions.map((cat) => (
                                                    <li key={cat.id} onClick={() => addCategory(cat.nombre)} className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0 flex justify-between">
                                                        <span>{cat.nombre}</span>
                                                        <span className="text-xs text-slate-400">Seleccionar</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 mt-4"
                                    disabled={isSaving || uploading}
                                >
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
                                    Guardar Cambios
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ZONA DE PELIGRO */}
                    <Card className="border-red-100 shadow-sm bg-red-50/50 mt-6">
                        <CardHeader className="pb-2 border-b border-red-100">
                            <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2">
                                <AlertTriangle size={16} /> Zona de Peligro
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-xs text-red-600 mb-4 leading-relaxed">
                                Eliminar el curso borrará permanentemente todo su contenido.
                            </p>
                            <Button
                                variant="destructive"
                                className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors h-9 text-xs font-bold"
                                onClick={handleDeleteCourse}
                                disabled={isDeleting || isSaving}
                            >
                                {isDeleting ? "Eliminando..." : "Eliminar Curso Permanentemente"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* --- COLUMNA DERECHA: PLAN DE ESTUDIOS --- */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Plan de Estudios</h2>
                            <p className="text-slate-500 text-sm mt-1">Estructura tu curso agregando módulos, lecciones multimedia y evaluaciones.</p>
                        </div>

                        {/* Este componente carga los módulos y también necesitará revisión, pero primero aseguramos la página padre */}
                        <CourseModules courseId={courseId} />
                    </div>
                </div>

            </div>
        </div>
    );
}