"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    UploadCloud,
    Link as LinkIcon,
    FileText,
    Video,
    Loader2,
    Save,
    ArrowLeft,
    Type,
    File,
    Youtube,
    Edit3
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

export default function EditMaterialPage() {
    // --- ESTADOS ---
    const [titulo, setTitulo] = useState("");
    const [tipo, setTipo] = useState("video");
    const [contenido, setContenido] = useState("");
    const [urlSubtitulos, setUrlSubtitulos] = useState("");

    // Archivo nuevo (opcional)
    const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);

    // Estados de UI
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const courseId = params.courseId as string;
    const materialId = params.materialId as string;
    const moduleId = searchParams.get('moduleId');

    // --- 1. CARGAR DATOS EXISTENTES ---
    useEffect(() => {
        const fetchMaterialData = async () => {
            if (!localStorage.getItem('jwtToken')) {
                router.push('/login');
                return;
            }
            if (!moduleId || !materialId) {
                toast.error("URL inválida (faltan parámetros).");
                return;
            }

            try {
                // Estrategia: Cargar todo el contenido del módulo y filtrar en el cliente
                // (O podrías tener un endpoint específico GET /materiales/{id} si tu backend lo soporta)
                const res = await api.get(`/modulos/${moduleId}/contenido`);

                const material = res.data.find((item: any) => item.id === materialId);

                if (material) {
                    setTitulo(material.titulo);
                    // Aseguramos minúsculas para el select
                    setTipo(material.subtipo ? material.subtipo.toLowerCase() : 'video');

                    // Si el backend devuelve 'contenido' como URL o texto, lo seteamos
                    setContenido(material.contenido || "");
                    setUrlSubtitulos(material.urlSubtitulos || "");
                } else {
                    toast.error("Material no encontrado en este módulo.");
                    router.push(`/instructor/courses/${courseId}`);
                }
            } catch (err: any) {
                console.error(err);
                toast.error("Error al cargar la información del material.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaterialData();
    }, [moduleId, materialId, router, courseId]);


    // --- 2. GUARDAR CAMBIOS (PUT con Axios) ---
    const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!titulo.trim()) { toast.warning("El título es obligatorio."); return; }

        setIsSaving(true);

        // Usamos FormData porque podría haber un archivo nuevo
        const formData = new FormData();

        formData.append("titulo", titulo);
        formData.append("tipo", tipo.toUpperCase()); // Aseguramos mayúsculas para el backend
        if (urlSubtitulos) formData.append("urlSubtitulos", urlSubtitulos);

        // Lógica de archivo vs contenido
        if (archivoNuevo) {
            formData.append("archivo", archivoNuevo);
        } else {
            // Si no hay archivo nuevo, enviamos el contenido actual (URL o texto)
            // El backend debería saber que si viene texto aquí, no actualiza el archivo binario
            formData.append("contenido", contenido);
        }

        try {
            // Axios con PUT y FormData
            await api.put(`/modulos/${moduleId}/materiales/${materialId}`, formData);

            toast.success("Material actualizado correctamente.");
            router.push(`/instructor/courses/${courseId}`);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const msg = err.response.data.error || err.response.data.mensaje || "Error al actualizar.";
                toast.error(msg);
            } else {
                toast.error("Error de conexión al guardar cambios.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center h-screen items-center text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando editor...</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-2xl min-h-screen flex flex-col justify-center">

            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="pl-0 text-slate-500 hover:text-slate-900">
                    <Link href={`/instructor/courses/${courseId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar edición
                    </Link>
                </Button>
            </div>

            <Card className="shadow-xl border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-slate-900 p-2 rounded-lg">
                            <Edit3 className="h-6 w-6 text-amber-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Editar Material</CardTitle>
                    </div>
                    <CardDescription>
                        Modifica los detalles de la lección o reemplaza el archivo actual.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={handleUpdate} className="space-y-6">

                        {/* TÍTULO */}
                        <div className="space-y-2">
                            <Label htmlFor="titulo" className="font-semibold text-slate-700">Título</Label>
                            <Input
                                id="titulo"
                                required
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                disabled={isSaving}
                                className="border-slate-200 focus-visible:ring-amber-500 h-11"
                            />
                        </div>

                        {/* TIPO */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-700">Formato</Label>
                            <Select
                                value={tipo}
                                onValueChange={(val) => {
                                    setTipo(val);
                                    // Limpiamos contenido si cambia drásticamente para evitar errores visuales
                                    if(val === 'texto' && (tipo === 'video' || tipo === 'pdf')) setContenido("");
                                }}
                                disabled={isSaving}
                            >
                                <SelectTrigger className="h-11 border-slate-200 focus:ring-amber-500">
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">
                                        <div className="flex items-center gap-2 font-medium"><Video size={16} className="text-blue-500"/> Video (MP4 / YouTube)</div>
                                    </SelectItem>
                                    <SelectItem value="pdf">
                                        <div className="flex items-center gap-2 font-medium"><File size={16} className="text-red-500"/> Documento PDF</div>
                                    </SelectItem>
                                    <SelectItem value="texto">
                                        <div className="flex items-center gap-2 font-medium"><Type size={16} className="text-slate-500"/> Lectura (Texto/HTML)</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* CONTENIDO / ARCHIVO */}
                        <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            {(tipo === 'video' || tipo === 'pdf') ? (
                                <div className="space-y-6">

                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2 font-bold text-slate-800">
                                            <UploadCloud size={18} className="text-amber-500"/> Reemplazar Archivo
                                        </Label>

                                        {/* Mostrar nombre del archivo actual si existe y no es URL externa */}
                                        {!archivoNuevo && contenido && !contenido.startsWith('http') && (
                                            <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded border border-slate-200 inline-block mb-2">
                                                Actual: <span className="font-mono text-slate-700 font-semibold">{contenido.split('/').pop()}</span>
                                            </div>
                                        )}

                                        <Input
                                            type="file"
                                            accept={tipo === 'video' ? "video/*" : "application/pdf"}
                                            onChange={(e) => {
                                                setArchivoNuevo(e.target.files ? e.target.files[0] : null);
                                                if(e.target.files?.[0]) setContenido("");
                                            }}
                                            disabled={isSaving}
                                            className="bg-white border-slate-200 cursor-pointer file:bg-slate-100 file:border-0 file:mr-4 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 transition-all"
                                        />
                                        <p className="text-xs text-slate-400 pl-1">Deja vacío para mantener el archivo actual.</p>
                                    </div>

                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-slate-200"></div>
                                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">O editar URL externa</span>
                                        <div className="flex-grow border-t border-slate-200"></div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2 text-slate-600 font-medium">
                                            {tipo === 'video' ? <Youtube size={16} className="text-red-500"/> : <LinkIcon size={16}/>}
                                            {tipo === 'video' ? "Enlace de YouTube / Vimeo" : "URL de PDF Online"}
                                        </Label>
                                        <Input
                                            type="url"
                                            placeholder="https://..."
                                            value={contenido}
                                            onChange={(e) => {
                                                setContenido(e.target.value);
                                                setArchivoNuevo(null);
                                            }}
                                            disabled={!!archivoNuevo || isSaving}
                                            className={`border-slate-200 focus-visible:ring-amber-500 ${archivoNuevo ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'bg-white'}`}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700">Contenido de Lectura</Label>
                                    <Textarea
                                        className="min-h-[200px] bg-white border-slate-200 focus-visible:ring-amber-500 resize-y p-4 text-base"
                                        value={contenido}
                                        onChange={(e) => setContenido(e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                            )}
                        </div>

                        {/* SUBTÍTULOS */}
                        {tipo === 'video' && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <Label htmlFor="subs" className="text-xs text-slate-400 uppercase font-bold tracking-wider">Opcional: Subtítulos</Label>
                                <Input
                                    id="subs"
                                    value={urlSubtitulos || ""}
                                    onChange={(e) => setUrlSubtitulos(e.target.value)}
                                    disabled={isSaving}
                                    className="h-9 text-sm border-slate-200"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button variant="outline" asChild disabled={isSaving} className="h-11 border-slate-300 text-slate-600 hover:bg-slate-50 font-medium px-6">
                                <Link href={`/instructor/courses/${courseId}`}>Cancelar</Link>
                            </Button>
                            <Button
                                type="submit"
                                className="min-w-[160px] h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                                disabled={isSaving}
                            >
                                {isSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Guardando...</> : <><Save className="mr-2 h-5 w-5"/> Guardar Cambios</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}