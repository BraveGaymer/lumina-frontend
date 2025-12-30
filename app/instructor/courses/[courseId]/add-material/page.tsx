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
    ArrowLeft,
    Type,
    File,
    Youtube
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

export default function AddMaterialPage() {
    // Estados del formulario
    const [titulo, setTitulo] = useState("");
    const [tipo, setTipo] = useState("video");
    const [contenido, setContenido] = useState("");
    const [urlSubtitulos, setUrlSubtitulos] = useState("");
    const [archivo, setArchivo] = useState<File | null>(null);

    // Estados de UI
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const courseId = params.courseId as string;
    const moduleId = searchParams.get('moduleId');

    useEffect(() => {
        // Validación básica de sesión (Axios maneja el 401, pero esto previene carga de UI innecesaria)
        if (!localStorage.getItem('jwtToken')) {
            router.push('/login');
        }
        if (!moduleId) {
            toast.error("Error crítico: No se identificó el módulo destino.");
            router.push(`/instructor/courses/${courseId}`);
        }
    }, [moduleId, router, courseId]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // VALIDACIONES
        if (!titulo.trim()) { toast.warning("El título es obligatorio."); return; }

        // Validación específica según tipo
        if ((tipo === 'video' || tipo === 'pdf') && !archivo && !contenido) {
            toast.warning("Debes subir un archivo o pegar una URL externa.");
            return;
        }
        if (tipo === 'texto' && !contenido.trim()) {
            toast.warning("El contenido de lectura no puede estar vacío.");
            return;
        }

        setIsLoading(true);

        // Construcción del FormData (Necesario para subir archivos)
        const formData = new FormData();
        formData.append("titulo", titulo);
        formData.append("tipo", tipo);
        if (urlSubtitulos) formData.append("urlSubtitulos", urlSubtitulos);

        if (tipo === 'video' || tipo === 'pdf') {
            if (archivo) {
                formData.append("archivo", archivo);
            } else {
                formData.append("contenido", contenido); // Si es URL externa
            }
        } else {
            formData.append("contenido", contenido); // Si es texto plano
        }

        try {
            // Axios detecta automáticamente FormData y configura el 'Content-Type' correcto
            await api.post(`/modulos/${moduleId}/materiales`, formData);

            toast.success("¡Material agregado exitosamente!");
            router.push(`/instructor/courses/${courseId}`);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const msg = err.response.data.error || err.response.data.mensaje || "Error al subir el material.";
                toast.error(msg);
            } else {
                toast.error("Error de conexión. Si subes un archivo grande, verifica tu conexión.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!moduleId) return null;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-2xl min-h-screen flex flex-col justify-center">

            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="pl-0 text-slate-500 hover:text-slate-900">
                    <Link href={`/instructor/courses/${courseId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar y volver
                    </Link>
                </Button>
            </div>

            <Card className="shadow-xl border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-slate-900 p-2 rounded-lg">
                            {tipo === 'video' && <Video className="h-6 w-6 text-amber-400" />}
                            {tipo === 'pdf' && <FileText className="h-6 w-6 text-amber-400" />}
                            {tipo === 'texto' && <Type className="h-6 w-6 text-amber-400" />}
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Agregar Material</CardTitle>
                    </div>
                    <CardDescription>
                        Sube contenido multimedia o crea lecciones de texto para tus estudiantes.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* TÍTULO */}
                        <div className="space-y-2">
                            <Label htmlFor="titulo" className="font-semibold text-slate-700">Título de la Lección</Label>
                            <Input
                                id="titulo"
                                placeholder="Ej: Introducción a React Hooks"
                                required
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                disabled={isLoading}
                                className="border-slate-200 focus-visible:ring-amber-500 h-11"
                            />
                        </div>

                        {/* TIPO */}
                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-700">Formato del Contenido</Label>
                            <Select onValueChange={setTipo} defaultValue="video" disabled={isLoading}>
                                <SelectTrigger className="h-11 border-slate-200 focus:ring-amber-500">
                                    <SelectValue />
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

                        {/* ÁREA DE CONTENIDO (DINÁMICA) */}
                        <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            {(tipo === 'video' || tipo === 'pdf') ? (
                                <div className="space-y-6">

                                    {/* OPCIÓN A: SUBIR ARCHIVO */}
                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2 font-bold text-slate-800">
                                            <UploadCloud size={18} className="text-amber-500"/> Subir Archivo
                                        </Label>
                                        <div className="flex flex-col gap-1">
                                            <Input
                                                type="file"
                                                accept={tipo === 'video' ? "video/*" : "application/pdf"}
                                                onChange={(e) => {
                                                    setArchivo(e.target.files ? e.target.files[0] : null);
                                                    setContenido(""); // Limpiar URL si sube archivo
                                                }}
                                                disabled={isLoading}
                                                className="bg-white border-slate-200 cursor-pointer file:bg-slate-100 file:border-0 file:mr-4 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 transition-all"
                                            />
                                            <p className="text-xs text-slate-400 pl-1">Máximo sugerido: 100MB.</p>
                                        </div>
                                    </div>

                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-slate-200"></div>
                                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">O usa un enlace</span>
                                        <div className="flex-grow border-t border-slate-200"></div>
                                    </div>

                                    {/* OPCIÓN B: URL EXTERNA */}
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
                                                setArchivo(null); // Limpiar archivo si escribe URL
                                            }}
                                            disabled={!!archivo || isLoading}
                                            className={`border-slate-200 focus-visible:ring-amber-500 ${archivo ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'bg-white'}`}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* OPCIÓN C: TEXTO */
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700">Contenido de Lectura</Label>
                                    <Textarea
                                        placeholder="Escribe el contenido de la lección aquí..."
                                        className="min-h-[250px] bg-white border-slate-200 focus-visible:ring-amber-500 resize-y p-4 text-base leading-relaxed"
                                        value={contenido}
                                        onChange={(e) => setContenido(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-slate-400 text-right">Puedes usar formato Markdown simple.</p>
                                </div>
                            )}
                        </div>

                        {/* SUBTÍTULOS (Solo Video) */}
                        {tipo === 'video' && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <Label htmlFor="subs" className="text-xs text-slate-400 uppercase font-bold tracking-wider">Opcional: Subtítulos</Label>
                                <Input
                                    id="subs"
                                    type="url"
                                    placeholder="URL de archivo .vtt o .srt"
                                    value={urlSubtitulos}
                                    onChange={(e) => setUrlSubtitulos(e.target.value)}
                                    disabled={isLoading}
                                    className="h-9 text-sm border-slate-200"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button variant="outline" asChild disabled={isLoading} className="h-11 border-slate-300 text-slate-600 hover:bg-slate-50 font-medium px-6">
                                <Link href={`/instructor/courses/${courseId}`}>Cancelar</Link>
                            </Button>

                            <Button
                                type="submit"
                                className="min-w-[160px] h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Guardando...</> : 'Guardar Lección'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}