"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { ExternalLink, CheckCircle, XCircle, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// --- INTERFACES ---
interface SuggestedMaterialDto {
    id: string;
    titulo: string;
    tipo: string;
}

interface ResultResponseDto {
    resultId: string;
    evaluationId: string;
    evaluationTitle: string;
    score: number;
    feedback: string;
    sugerencias: SuggestedMaterialDto[];
}

interface CourseEvaluationProps {
    courseId: string;
    evaluationId: string;
    moduleId: string;
}

export function CourseEvaluation({ courseId, evaluationId, moduleId }: CourseEvaluationProps) {
    const [evaluation, setEvaluation] = useState<any>(null);
    const [respuestasUsuario, setRespuestasUsuario] = useState<Record<string, string>>({});
    const [resultado, setResultado] = useState<ResultResponseDto | null>(null);
    const [cargando, setCargando] = useState(false);

    // 1. Cargar evaluación (GET)
    useEffect(() => {
        const fetchEval = async () => {
            try {
                // Axios gestiona la URL y el Token
                const res = await api.get(`/modulos/${moduleId}/evaluaciones/${evaluationId}`);
                setEvaluation(res.data);
            } catch (e: any) {
                console.error(e);
                toast.error("No se pudo cargar la evaluación.");
            }
        };
        fetchEval();
    }, [moduleId, evaluationId]);

    const handleSeleccionarRespuesta = (preguntaId: string, respuestaId: string) => {
        setRespuestasUsuario(prev => ({ ...prev, [preguntaId]: respuestaId }));
    };

    // 2. Enviar respuestas (POST)
    const handleTerminarEvaluacion = async () => {
        if (!evaluation) return;

        // Validación básica: ¿Respondió todo?
        if (Object.keys(respuestasUsuario).length < evaluation.preguntas.length) {
            toast.warning("Por favor responde todas las preguntas antes de enviar.");
            return;
        }

        setCargando(true);
        try {
            const submissionData = {
                respuestas: Object.entries(respuestasUsuario).map(([qId, aId]) => ({
                    questionId: qId,
                    chosenAnswerId: aId
                }))
            };

            // Petición POST con Axios
            const res = await api.post(`/modulos/${moduleId}/evaluaciones/${evaluationId}/submit`, submissionData);

            setResultado(res.data);

            // Scroll arriba para ver resultado
            window.scrollTo({ top: 0, behavior: 'smooth' });
            toast.success("Evaluación enviada correctamente.");

        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.error || "Error al calificar.");
            } else {
                toast.error("Error de conexión al enviar respuestas.");
            }
        } finally {
            setCargando(false);
        }
    };

    // --- RENDERIZADO DEL RESULTADO (MODO COMPACTO) ---
    if (resultado) {
        const aprobado = resultado.score >= 60;

        return (
            <div className="max-w-md mx-auto mt-8 animate-in fade-in zoom-in duration-500">

                {/* TARJETA DE CALIFICACIÓN */}
                <div className={`p-8 rounded-2xl text-center mb-6 border-2 shadow-sm ${
                    aprobado ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                }`}>
                    <div className="mb-4 flex justify-center">
                        {aprobado ?
                            <div className="bg-emerald-100 p-3 rounded-full"><CheckCircle className="h-12 w-12 text-emerald-600"/></div> :
                            <div className="bg-red-100 p-3 rounded-full"><XCircle className="h-12 w-12 text-red-600"/></div>
                        }
                    </div>

                    <h2 className="text-2xl font-bold mb-2 text-slate-900">{resultado.feedback}</h2>

                    <div className="my-4">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-1">Calificación Final</span>
                        <span className={`text-5xl font-black ${aprobado ? 'text-emerald-600' : 'text-red-600'}`}>
                            {resultado.score.toFixed(0)}%
                        </span>
                    </div>

                    <p className="text-sm text-slate-600 px-4">
                        {aprobado ? "¡Excelente trabajo! Has demostrado dominio del tema." : "No te desanimes. Revisa el material sugerido y vuelve a intentarlo."}
                    </p>
                </div>

                {/* --- SECCIÓN DE MATERIAL SUGERIDO --- */}
                {resultado.sugerencias && resultado.sugerencias.length > 0 && (
                    <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-wider border-b border-slate-100 pb-2">
                            <BookOpen className="h-4 w-4 text-amber-500"/>
                            Repasar para mejorar:
                        </h3>
                        <div className="space-y-3">
                            {resultado.sugerencias.map((material, idx) => {
                                const titulo = material.titulo || "Material de refuerzo";
                                const tipo = material.tipo || "RECURSO";

                                return (
                                    <Link
                                        key={material.id || idx}
                                        href={`/learn/${courseId}?materialId=${material.id}`}
                                        className="group flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase shrink-0 ${
                                                tipo === 'VIDEO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                                            }`}>
                                                {tipo}
                                            </span>
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate">
                                                {titulo}
                                            </span>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-amber-500 shrink-0 ml-2 transition-colors" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => { setResultado(null); setRespuestasUsuario({}); }}
                    className="mt-8 w-full bg-slate-900 text-white py-3.5 rounded-xl hover:bg-slate-800 font-bold text-sm shadow-lg transition-transform active:scale-[0.98]"
                >
                    Volver a intentar evaluación
                </button>
            </div>
        );
    }

    // --- RENDERIZADO DE PREGUNTAS ---
    if (!evaluation) return <div className="p-20 text-center text-slate-400 flex flex-col items-center"><Loader2 className="animate-spin h-8 w-8 mb-2"/> Cargando examen...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 animate-in slide-in-from-bottom-8">
            <div className="mb-8 border-b border-slate-100 pb-6 text-center">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{evaluation.titulo}</h2>
                <p className="text-slate-500 mt-2 text-sm">Lee atentamente y selecciona la mejor respuesta.</p>
            </div>

            <div className="space-y-10">
                {evaluation.preguntas.map((pregunta: any, index: number) => (
                    <div key={pregunta.id} className="group">
                        <p className="font-bold text-slate-800 mb-4 text-lg leading-snug flex gap-3">
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md text-sm h-fit mt-0.5">{index + 1}</span>
                            {pregunta.textoPregunta}
                        </p>
                        <div className="space-y-3 pl-2 md:pl-11">
                            {pregunta.respuestas.map((respuesta: any) => (
                                <label key={respuesta.id} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                                    respuestasUsuario[pregunta.id] === respuesta.id
                                        ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                                        : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 shrink-0 transition-colors ${
                                        respuestasUsuario[pregunta.id] === respuesta.id
                                            ? 'border-blue-600 bg-blue-600'
                                            : 'border-slate-300 bg-white'
                                    }`}>
                                        {respuestasUsuario[pregunta.id] === respuesta.id && (
                                            <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                                        )}
                                    </div>
                                    <input
                                        type="radio"
                                        name={`p-${pregunta.id}`}
                                        className="hidden"
                                        onChange={() => handleSeleccionarRespuesta(pregunta.id, respuesta.id)}
                                        checked={respuestasUsuario[pregunta.id] === respuesta.id}
                                    />
                                    <span className={`text-sm ${respuestasUsuario[pregunta.id] === respuesta.id ? 'text-blue-900 font-medium' : 'text-slate-600'}`}>
                                        {respuesta.textoRespuesta}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end">
                <button
                    onClick={handleTerminarEvaluacion}
                    disabled={cargando}
                    className="w-full md:w-auto px-8 bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 font-bold text-base shadow-lg shadow-slate-900/10 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2"
                >
                    {cargando ? <Loader2 className="animate-spin h-5 w-5"/> : <CheckCircle className="h-5 w-5"/>}
                    {cargando ? 'Evaluando...' : 'Enviar Evaluación'}
                </button>
            </div>
        </div>
    );
}