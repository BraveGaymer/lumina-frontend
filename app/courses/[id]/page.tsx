"use client";

// --- 1. IMPORTACIONES ---
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Lock,
    Loader2,
    ShoppingCart,
    BookOpen,
    PlayCircle,
    Sparkles,
    CheckCircle2,
    FileText,
    Trophy,
    MonitorPlay,
    ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Importamos tu configuración segura

// --- 2. DEFINICIÓN DE TIPOS ---
interface ContentItem {
    id: string;
    titulo: string;
    tipo?: string;
    itemType?: 'material' | 'evaluation';
}

interface CourseModule {
    id: string;
    titulo: string;
    orderIndex: number;
    contenido: ContentItem[];
}

interface CourseDetail {
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    categorias: string[];
    nombreInstructor: string;
    modulos: CourseModule[];
    inscrito: boolean;
    portadaUrl?: string;
}

// --- 3. EL COMPONENTE DE LA PÁGINA ---
export default function CourseDetailPage() {

    // --- 4. MANEJO DE ESTADO ---
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isAddingCart, setIsAddingCart] = useState(false);

    const router = useRouter();
    const params = useParams();
    // Aseguramos que el ID sea string (Next.js a veces devuelve array)
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    // --- 5. LÓGICA DE CARGA DE DATOS (Con Axios) ---
    useEffect(() => {
        const fetchCourseDetail = async () => {
            if (!id) return;

            try {
                // Axios maneja la URL base y el token automáticamente
                const response = await api.get(`/cursos/${id}`);
                setCourse(response.data);

            } catch (err: any) {
                console.error(err);
                if (err.response && err.response.status === 404) {
                    toast.error("El curso que buscas no existe.");
                    router.push('/courses');
                } else {
                    toast.error("No pudimos cargar la información del curso.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourseDetail();
    }, [id, router]);

    // --- 6. FUNCIÓN PARA INSCRIBIRSE (Compra directa/Gratis) ---
    const handleEnroll = async () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            toast.warning("Debes iniciar sesión para inscribirte.");
            router.push('/login');
            return;
        }

        if (isEnrolling) return;
        setIsEnrolling(true);

        try {
            // Petición POST limpia con Axios
            await api.post(`/pagos/curso/${id}`);

            toast.success("¡Inscripción exitosa!", {
                description: "Ya tienes acceso completo al curso."
            });

            // Recargamos para actualizar el estado de "inscrito"
            setTimeout(() => window.location.reload(), 1500);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const msg = err.response.data.error || err.response.data.mensaje || "Error al procesar inscripción.";
                toast.error(msg);
            } else {
                toast.error("Error de conexión al inscribirse.");
            }
        } finally {
            setIsEnrolling(false);
        }
    };

    // --- 7. FUNCIÓN AGREGAR AL CARRITO ---
    const handleAddToCart = async () => {
        const token = localStorage.getItem('jwtToken');
        if(!token) {
            toast.warning("Inicia sesión para usar el carrito.");
            router.push('/login');
            return;
        }

        if (isAddingCart) return;
        setIsAddingCart(true);

        try {
            await api.post('/cart/add', { cursoId: course?.id });
            toast.success("Curso agregado al carrito");
        } catch (err: any) {
            if (err.response && err.response.data) {
                toast.error(err.response.data.error || "No se pudo agregar al carrito");
            } else {
                toast.error("Error de conexión");
            }
        } finally {
            setIsAddingCart(false);
        }
    };

    // --- 8. RENDERIZADO ---
    if (isLoading) return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin text-slate-900 h-10 w-10"/></div>;
    if (!course) return <div className="text-center p-20 text-slate-500">Curso no encontrado.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl min-h-screen">

            {/* --- BOTÓN DE VOLVER --- */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    asChild
                    className="pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent"
                >
                    <Link href="/courses" aria-label="Volver al catálogo de cursos">
                        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                        Volver al Catálogo
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- COLUMNA IZQUIERDA: INFO Y TEMARIO --- */}
                <div className="lg:col-span-2 space-y-8 animate-in slide-in-from-left-4 duration-500">
                    {/* Encabezado */}
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4 items-center">
                            {course.categorias.map(cat => (
                                <Badge key={cat} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                                    {cat}
                                </Badge>
                            ))}
                        </div>

                        <h1 className="text-4xl font-bold mb-4 text-slate-900 leading-tight">{course.titulo}</h1>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed whitespace-pre-wrap">{course.descripcion}</p>

                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                            <span className="text-sm text-slate-500">Instructor:</span>
                            <span className="font-bold text-slate-900">{course.nombreInstructor}</span>
                        </div>
                    </div>

                    {/* Temario */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-slate-900">
                            <BookOpen className="h-6 w-6 text-amber-500" aria-hidden="true"/> Contenido del Curso
                        </h2>

                        {course.modulos && course.modulos.length > 0 ? (
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <Accordion type="single" collapsible className="w-full">
                                        {course.modulos.map((modulo) => (
                                            <AccordionItem key={modulo.id} value={modulo.id} className="border-b border-slate-100 last:border-0">
                                                <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 hover:no-underline transition-colors">
                                                    <span className="font-bold text-left text-slate-800">{modulo.titulo}</span>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-4 pt-1 px-6 bg-slate-50/50">
                                                    <ul className="space-y-3 mt-2">
                                                        {modulo.contenido && modulo.contenido.map((item) => {
                                                            const isVideo = item.tipo?.toUpperCase() === 'VIDEO';
                                                            const isExam = item.tipo?.toUpperCase() === 'EXAMEN' || item.itemType === 'evaluation';
                                                            const isPDF = item.tipo?.toUpperCase() === 'PDF';

                                                            return (
                                                                <li key={item.id} className="flex items-center text-slate-600 text-sm group p-2 rounded-md hover:bg-white transition-colors">
                                                                    {course.inscrito ? (
                                                                        isVideo ? <MonitorPlay className="h-4 w-4 mr-3 text-blue-500" /> :
                                                                            isExam ? <Trophy className="h-4 w-4 mr-3 text-amber-500" /> :
                                                                                <FileText className="h-4 w-4 mr-3 text-slate-400" />
                                                                    ) : (
                                                                        <Lock className="h-4 w-4 mr-3 text-slate-400 group-hover:text-slate-600" />
                                                                    )}

                                                                    <span className="mr-auto font-medium">{item.titulo}</span>

                                                                    <div className="ml-2">
                                                                        {isVideo && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100">Video</Badge>}
                                                                        {isExam && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-100">Examen</Badge>}
                                                                        {isPDF && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-100">PDF</Badge>}
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="p-8 border rounded-lg bg-slate-50 text-center text-slate-500 border-dashed">
                                El instructor aún no ha publicado el temario detallado.
                            </div>
                        )}
                    </div>
                </div>

                {/* --- COLUMNA DERECHA: CTA (STICKY) --- */}
                <div className="lg:col-span-1 animate-in slide-in-from-right-4 duration-500 delay-150">
                    <div className="sticky top-24">
                        <Card className="shadow-xl border-t-4 border-t-slate-900 overflow-hidden border-slate-200">

                            {/* IMAGEN DE PORTADA / PREVIEW */}
                            <div className="h-40 bg-slate-100 relative overflow-hidden">
                                {course.portadaUrl ? (
                                    <img src={course.portadaUrl} alt={course.titulo} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-amber-400">
                                        <Sparkles size={48} className="mb-2 opacity-90"/>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Lumina Learning</span>
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-6 space-y-6">
                                <div className="text-center space-y-1">
                                    {course.inscrito ? (
                                        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-2 text-sm font-bold border border-green-200 flex items-center justify-center gap-2">
                                            <CheckCircle2 size={18} /> ¡Ya estás inscrito!
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Precio del curso</p>
                                            <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                                ${course.precio.toFixed(2)}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {course.inscrito ? (
                                    <Button
                                        onClick={() => router.push(`/learn/${course.id}`)}
                                        size="lg"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6 shadow-md transition-all hover:scale-[1.02]"
                                        aria-label="Ir al reproductor del curso"
                                    >
                                        <PlayCircle className="mr-2 h-6 w-6" /> Continuar Aprendiendo
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleEnroll}
                                            size="lg"
                                            disabled={isEnrolling}
                                            className="w-full bg-slate-900 hover:bg-slate-800 text-lg py-6 shadow-lg transition-all hover:scale-[1.02]"
                                            aria-label={`Inscribirse al curso por $${course.precio}`}
                                        >
                                            {isEnrolling ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Inscribirse Ahora"}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                                            disabled={isAddingCart}
                                            onClick={handleAddToCart}
                                            aria-label="Agregar curso al carrito de compras"
                                        >
                                            {isAddingCart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                                            {isAddingCart ? "Agregando..." : "Agregar al Carrito"}
                                        </Button>
                                    </div>
                                )}

                                {!course.inscrito && (
                                    <p className="text-xs text-center text-slate-400 mt-4">
                                        Acceso de por vida • Certificado de finalización • Garantía Lumina
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}