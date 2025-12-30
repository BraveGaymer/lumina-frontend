"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Trash2,
    ArrowLeft,
    Package,
    Plus,
    Tag,
    Loader2,
    CheckSquare,
    Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- IMPORTANTE: Tu nueva conexión a AWS

// --- TIPOS ---
interface Course {
    id: string;
    titulo: string;
    precio: number;
}

interface Bundle {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    nombresCursos: string[];
}

export default function BundlesPage() {
    // --- ESTADOS ---
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

    // Formulario
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precio, setPrecio] = useState(""); // String para regex
    const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());

    // UI
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    // --- CARGA INICIAL (Con Axios) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Hacemos las dos peticiones al mismo tiempo para ahorrar tiempo
                const [bundlesRes, coursesRes] = await Promise.all([
                    api.get('/admin/bundles'), // Ya no ponemos localhost
                    api.get('/cursos')
                ]);

                setBundles(bundlesRes.data);
                setAvailableCourses(coursesRes.data);

            } catch (error) {
                console.error("Error cargando datos:", error);
                toast.error("Error al cargar la información del servidor.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- MANEJO DE SELECCIÓN ---
    const toggleCourseSelection = (courseId: string) => {
        setSelectedCourseIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(courseId)) newSet.delete(courseId);
            else newSet.add(courseId);
            return newSet;
        });
    };

    // --- CONTROL DE PRECIO (REGEX) ---
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || /^\d*(\.\d{0,2})?$/.test(value)) {
            setPrecio(value);
        }
    };

    // --- CREAR BUNDLE (Con Axios) ---
    const handleCreateBundle = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones locales
        if (!nombre.trim()) { toast.warning("El nombre es obligatorio."); return; }
        if (!descripcion.trim()) { toast.warning("La descripción es obligatoria."); return; }

        const precioNumerico = parseFloat(precio);
        if (!precio || isNaN(precioNumerico) || precioNumerico <= 0) {
            toast.warning("El precio debe ser mayor a $0.00");
            return;
        }

        if (selectedCourseIds.size < 2) {
            toast.warning("Selecciona al menos 2 cursos para crear un paquete.");
            return;
        }

        setIsSubmitting(true);

        const bundleData = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precioPreferencial: precioNumerico,
            cursoIds: Array.from(selectedCourseIds)
        };

        try {
            // Petición POST limpia con Axios
            await api.post('/admin/bundles', bundleData);

            toast.success("¡Paquete creado exitosamente!");

            // Recargamos la página para ver los cambios frescos
            window.location.reload();

        } catch (err: any) {
            console.error(err);
            // Manejo de errores específico de Axios
            if (err.response && err.response.data) {
                const msg = err.response.data.mensaje || err.response.data.error || "Error al crear el paquete.";
                toast.error(msg);
            } else {
                toast.error("Error de conexión con el servidor.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ELIMINAR BUNDLE (Con Axios) ---
    const handleDeleteBundle = async (bundleId: string) => {
        if (!confirm("¿Eliminar este paquete? Los cursos individuales no se borrarán.")) return;

        try {
            // Petición DELETE limpia
            await api.delete(`/admin/bundles/${bundleId}`);

            toast.success("Paquete eliminado.");
            // Actualizamos la lista localmente sin recargar toda la página
            setBundles(prev => prev.filter(b => b.id !== bundleId));

        } catch (err: any) {
            console.error(err);
            toast.error("Error al eliminar el paquete.");
        }
    };

    if (isLoading) return <div className="flex justify-center h-screen items-center text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando paquetes...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* CABECERA */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="h-8 w-8 text-purple-600" />
                        Gestión de Paquetes
                    </h1>
                    <p className="text-slate-500">Crea ofertas atractivas agrupando múltiples cursos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- FORMULARIO (COLUMNA IZQUIERDA) --- */}
                <Card className="lg:col-span-1 h-fit border-t-4 border-t-purple-600 shadow-md border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-slate-800">Nuevo Paquete</CardTitle>
                        <CardDescription>Define los detalles de la oferta.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleCreateBundle} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Nombre del Combo</Label>
                                <Input
                                    placeholder="Ej. Fullstack Java + React 2024"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    className="border-slate-200 focus-visible:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Descripción</Label>
                                <Textarea
                                    placeholder="Incluye acceso completo a..."
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                    className="border-slate-200 focus-visible:ring-purple-500 resize-none min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold flex items-center gap-2">
                                    <Tag size={16} /> Precio Oferta ($)
                                </Label>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="49.99"
                                    value={precio}
                                    onChange={handlePriceChange}
                                    className="border-slate-200 focus-visible:ring-purple-500 font-mono"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold">Selecciona los Cursos</Label>
                                <div className="border border-slate-200 rounded-lg h-60 overflow-y-auto bg-slate-50/50 p-2 custom-scrollbar">
                                    {availableCourses.length === 0 ? (
                                        <p className="text-xs text-center text-slate-400 py-10">No hay cursos disponibles.</p>
                                    ) : (
                                        availableCourses.map(course => {
                                            const isSelected = selectedCourseIds.has(course.id);
                                            return (
                                                <div
                                                    key={course.id}
                                                    className={`flex items-start gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-white ${isSelected ? 'bg-purple-50 border border-purple-100' : ''}`}
                                                    onClick={() => toggleCourseSelection(course.id)}
                                                >
                                                    <div className={`mt-0.5 ${isSelected ? 'text-purple-600' : 'text-slate-300'}`}>
                                                        {isSelected ? <CheckSquare size={18}/> : <Square size={18}/>}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium leading-tight ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>
                                                            {course.titulo}
                                                        </p>
                                                        <span className="text-xs text-slate-500 font-mono">${course.precio}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 px-1">
                                    <span>Mínimo 2 cursos requeridos</span>
                                    <span className={selectedCourseIds.size >= 2 ? "text-purple-600 font-bold" : ""}>
                                        {selectedCourseIds.size} seleccionados
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Plus className="h-4 w-4 mr-2"/>}
                                Crear Paquete
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* --- LISTA (COLUMNA DERECHA) --- */}
                <Card className="lg:col-span-2 shadow-md border-slate-200 h-fit">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-slate-800">Paquetes Activos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px] font-bold text-slate-700">Paquete</TableHead>
                                    <TableHead className="font-bold text-slate-700">Contenido</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">Precio</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bundles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                                            <Package className="h-10 w-10 mx-auto mb-2 opacity-20"/>
                                            <p>No hay paquetes creados.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bundles.map((bundle) => (
                                        <TableRow key={bundle.id} className="hover:bg-slate-50/50">
                                            <TableCell className="align-top py-4">
                                                <p className="font-bold text-slate-900 text-base">{bundle.nombre}</p>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{bundle.descripcion}</p>
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {bundle.nombresCursos.map((c, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-white border border-slate-200 text-slate-600 font-normal shadow-sm hover:bg-purple-50">
                                                            {c}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-purple-700 text-base align-top py-4">
                                                ${bundle.precio}
                                            </TableCell>
                                            <TableCell className="align-top py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeleteBundle(bundle.id)}
                                                    title="Eliminar Paquete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}