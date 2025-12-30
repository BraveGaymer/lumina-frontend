"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    PlayCircle,
    FileText,
    ChevronLeft,
    ChevronRight,
    Trophy,
    ClipboardList,
    File,
    ExternalLink,
    Loader2,
    MonitorPlay,
    CheckCircle2
} from "lucide-react";
import { CourseEvaluation } from "@/components/courses/course-evaluation";
import { CourseRating } from "@/components/courses/course-rating";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// --- TIPOS ---
interface ContentItem {
    id: string;
    titulo: string;
    tipo?: string;
    contenido?: string;
    urlSubtitulos?: string;
    orderIndex: number;
    itemType: 'material' | 'evaluation';
    moduleId: string;
}

interface CourseModule {
    id: string;
    titulo: string;
    contenido: ContentItem[];
}

interface CourseDetail {
    id: string;
    titulo: string;
    modulos: CourseModule[];
}

export default function CoursePlayerPage() {
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [flatList, setFlatList] = useState<ContentItem[]>([]);
    const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
    const [isExamStarted, setIsExamStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    // Aseguramos que sea string
    const courseId = (Array.isArray(params.courseId) ? params.courseId[0] : params.courseId) || "";

    // --- DETECTORES DE VIDEO (Se mantienen igual) ---
    const getYouTubeEmbed = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    const getVimeoEmbed = (url: string) => {
        const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
        const match = url.match(regExp);
        return match ? `https://player.vimeo.com/video/${match[1]}` : null;
    };

    const isDirectVideo = (url: string) => {
        return url.match(/\.(mp4|webm|ogg)$/i);
    };

    // --- CARGA DE DATOS (Con Axios) ---
    useEffect(() => {
        if (!courseId) return;
        const fetchData = async () => {
            if (!localStorage.getItem('jwtToken')) {
                router.push('/login');
                return;
            }

            try {
                // Axios gestiona la URL y el Token
                const response = await api.get(`/cursos/${courseId}`);
                const data: CourseDetail = response.data;

                setCourse(data);

                // Aplanar lista para navegación prev/next
                const allItems: ContentItem[] = [];
                if (data.modulos) {
                    data.modulos.forEach(mod => {
                        if (mod.contenido) {
                            // Inyectamos el moduleId a cada item para saber su origen
                            const itemsWithModule = mod.contenido.map(c => ({ ...c, moduleId: mod.id }));
                            allItems.push(...itemsWithModule);
                        }
                    });
                }
                setFlatList(allItems);
            } catch (error: any) {
                console.error(error);
                if (error.response && error.response.status === 403) {
                    toast.error("No estás inscrito en este curso.");
                    router.push(`/courses/${courseId}`); // Redirigir a la página de venta
                } else {
                    toast.error("Error al cargar el contenido del curso.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [courseId, router]);

    // --- SELECCIÓN INICIAL (Lógica local) ---
    useEffect(() => {
        if (flatList.length === 0) return;

        // 1. Prioridad: URL param (?materialId=XYZ)
        const reqId = searchParams.get('materialId');
        if (reqId) {
            const target = flatList.find(i => i.id === reqId);
            if (target) { setActiveItem(target); return; }
        }

        // 2. Prioridad: Guardado local (localStorage)
        if (!activeItem) {
            const saved = localStorage.getItem(`course_progress_${courseId}`);
            if (saved) {
                const found = flatList.find(i => i.id === saved);
                if (found) { setActiveItem(found); return; }
            }
            // 3. Fallback: El primero de la lista
            if (flatList.length > 0) setActiveItem(flatList[0]);
        }
    }, [flatList, searchParams, courseId, activeItem]);

    // --- GUARDAR PROGRESO LOCAL ---
    useEffect(() => {
        if (activeItem && courseId) {
            localStorage.setItem(`course_progress_${courseId}`, activeItem.id);
            // Resetear estado de examen al cambiar de lección
            setIsExamStarted(false);
        }
    }, [activeItem, courseId]);

    // --- NAVEGACIÓN ---
    const goNext = () => {
        const idx = activeItem ? flatList.findIndex(i => i.id === activeItem.id) : -1;
        if (idx < flatList.length - 1) setActiveItem(flatList[idx + 1]);
    };
    const goPrev = () => {
        const idx = activeItem ? flatList.findIndex(i => i.id === activeItem.id) : -1;
        if (idx > 0) setActiveItem(flatList[idx - 1]);
    };
    const currentIndex = activeItem ? flatList.findIndex(i => i.id === activeItem.id) : -1;

    // --- RENDERIZADORES DE CONTENIDO ---
    const renderMainContent = () => {
        if (!activeItem) return <div className="text-center p-20 text-slate-400">Selecciona una lección para comenzar</div>;

        const tipoNormalizado = activeItem.tipo ? activeItem.tipo.toUpperCase() : "LECCION";
        const isExam = activeItem.itemType === 'evaluation' || tipoNormalizado === 'EXAMEN';

        // 1. EXAMEN
        if (isExam) {
            if (isExamStarted) {
                return <CourseEvaluation courseId={courseId} evaluationId={activeItem.id} moduleId={activeItem.moduleId} />;
            }
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-slate-50 rounded-xl border border-slate-200 text-center animate-in fade-in zoom-in duration-300">
                    <div className="bg-amber-100 p-6 rounded-full mb-6">
                        <Trophy className="h-16 w-16 text-amber-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{activeItem.titulo}</h2>
                    <p className="text-slate-500 mb-8 max-w-md">Pon a prueba tus conocimientos. Asegúrate de haber repasado las lecciones anteriores antes de comenzar.</p>
                    <Button onClick={() => setIsExamStarted(true)} size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-lg transition-transform hover:scale-105">
                        <ClipboardList className="mr-2 h-5 w-5" /> Comenzar Examen
                    </Button>
                </div>
            );
        }

        // 2. VIDEO
        if (tipoNormalizado === 'VIDEO') {
            const url = activeItem.contenido || "";
            const youtubeEmbed = getYouTubeEmbed(url);
            const vimeoEmbed = getVimeoEmbed(url);
            const isNative = isDirectVideo(url);

            return (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="border-b border-slate-100 pb-4 mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider">Video</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{activeItem.titulo}</h2>
                    </div>

                    <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-2xl relative border border-slate-800">
                        {youtubeEmbed ? (
                            <iframe className="w-full h-full" src={youtubeEmbed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        ) : vimeoEmbed ? (
                            <iframe className="w-full h-full" src={vimeoEmbed} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen></iframe>
                        ) : isNative ? (
                            <video
                                controls
                                className="w-full h-full"
                                src={url}
                                controlsList="nodownload"
                                crossOrigin="anonymous"
                            >
                                {/* SUBTÍTULOS PRESERVADOS */}
                                {activeItem.urlSubtitulos && (
                                    <track
                                        kind="subtitles"
                                        src={activeItem.urlSubtitulos}
                                        srcLang="es"
                                        label="Español"
                                        default
                                    />
                                )}
                                Tu navegador no soporta video HTML5.
                            </video>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-white bg-slate-900 gap-4 p-4 text-center">
                                <PlayCircle className="h-16 w-16 opacity-50" />
                                <div>
                                    <p className="font-semibold text-lg text-slate-200">Contenido Externo</p>
                                    <p className="text-sm text-slate-400">Este video está alojado en una plataforma externa.</p>
                                </div>
                                <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800" asChild>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                        Abrir Video <ExternalLink size={16}/>
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // 3. PDF
        if (tipoNormalizado === 'PDF') {
            return (
                <div className="flex flex-col items-center justify-center p-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mt-4 animate-in fade-in">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <FileText className="h-12 w-12 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{activeItem.titulo}</h3>
                    <p className="text-slate-500 mb-6 text-sm">Documento de lectura disponible para descarga.</p>
                    <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                        <a href={activeItem.contenido} target="_blank" rel="noopener noreferrer">
                            <File className="mr-2 h-4 w-4"/> Descargar PDF
                        </a>
                    </Button>
                </div>
            );
        }

        // 4. TEXTO / DEFAULT
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-slate-100 pb-4 mb-6">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">Lección</span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1">{activeItem.titulo}</h2>
                </div>
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                    {activeItem.contenido || "No hay contenido disponible."}
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="flex justify-center h-screen items-center bg-slate-50 text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando aula...</div>;
    if (!course) return <div className="p-20 text-center text-slate-500">Curso no encontrado o no tienes acceso.</div>;

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="container mx-auto p-4 lg:p-6 max-w-[1600px]">

                {/* HEADER SUPERIOR */}
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent">
                        <Link href="/my-courses" className="flex items-center gap-2" aria-label="Volver a mis cursos">
                            <ChevronLeft className="h-4 w-4" /> Volver al Dashboard
                        </Link>
                    </Button>
                    <h1 className="text-sm font-bold text-slate-900 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 hidden md:block">
                        {course.titulo}
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* --- COLUMNA PRINCIPAL (CONTENIDO) --- */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                                {renderMainContent()}
                            </div>

                            {/* BARRA DE NAVEGACIÓN INFERIOR */}
                            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
                                <Button
                                    onClick={goPrev}
                                    disabled={currentIndex <= 0}
                                    variant="outline"
                                    className="w-32 border-slate-300 hover:bg-white text-slate-700"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                                </Button>

                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Paso {currentIndex + 1} de {flatList.length}
                                </span>

                                <Button
                                    onClick={goNext}
                                    disabled={currentIndex >= flatList.length - 1}
                                    className="w-32 bg-slate-900 hover:bg-slate-800 text-white"
                                >
                                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* COMPONENTE DE CALIFICACIÓN */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <CourseRating courseId={courseId} />
                        </div>
                    </div>

                    {/* --- COLUMNA LATERAL (TEMARIO) --- */}
                    <div className="lg:col-span-4 space-y-6 h-fit">

                        {/* PROGRESO */}
                        <Card className="shadow-sm border-slate-200 bg-white">
                            <CardHeader className="pb-3 pt-5">
                                <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">Tu Progreso</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-slate-500">Completado</span>
                                    <span className="font-bold text-emerald-600">{flatList.length > 0 ? Math.round(((currentIndex + 1) / flatList.length) * 100) : 0}%</span>
                                </div>
                                <Progress value={flatList.length > 0 ? ((currentIndex + 1) / flatList.length) * 100 : 0} className="h-2 bg-slate-100" />
                            </CardContent>
                        </Card>

                        {/* LISTA DE MÓDULOS */}
                        <Card className="shadow-sm border-slate-200 flex flex-col overflow-hidden max-h-[calc(100vh-250px)]">
                            <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-amber-500"/> Plan de Estudios
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                                {course.modulos?.map((modulo) => (
                                    <div key={modulo.id} className="border-b border-slate-100 last:border-0">
                                        <div className="bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
                                            {modulo.titulo}
                                        </div>
                                        <div className="flex flex-col">
                                            {modulo.contenido?.map((item) => {
                                                const isActive = activeItem?.id === item.id;
                                                const iType = item.tipo ? item.tipo.toUpperCase() : "";
                                                const isExam = item.itemType === 'evaluation' || iType === 'EXAMEN';

                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setActiveItem(item)}
                                                        className={`w-full text-left py-3 px-4 flex items-start gap-3 transition-all border-l-4 ${
                                                            isActive
                                                                ? "bg-amber-50 text-amber-900 border-amber-500 font-medium"
                                                                : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
                                                        }`}
                                                    >
                                                        <div className="mt-0.5 shrink-0">
                                                            {isExam ? <Trophy className={`h-4 w-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} /> :
                                                                iType === 'VIDEO' ? <MonitorPlay className={`h-4 w-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} /> :
                                                                    iType === 'PDF' ? <File className={`h-4 w-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} /> :
                                                                        <FileText className={`h-4 w-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm truncate leading-snug">{item.titulo}</p>
                                                        </div>
                                                        {isActive && <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}