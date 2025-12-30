"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2, Save, BookOpen, CheckCircle2, ArrowLeft, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// --- INTERFACES ---

interface MaterialSimple {
    id: string;
    titulo: string;
    tipo: string;
}

interface AnswerState {
    textoRespuesta: string;
    esCorrecta: boolean;
}

interface QuestionState {
    textoPregunta: string;
    respuestas: AnswerState[];
    materialesSugeridosIds: string[];
}

const MAX_OPTIONS = 5;

export default function AddEvaluationPage() {
    // ESTADOS
    const [titulo, setTitulo] = useState("");
    const [questions, setQuestions] = useState<QuestionState[]>([
        {
            textoPregunta: "",
            respuestas: [{ textoRespuesta: "", esCorrecta: true }, { textoRespuesta: "", esCorrecta: false }],
            materialesSugeridosIds: []
        }
    ]);
    const [materialesDisponibles, setMaterialesDisponibles] = useState<MaterialSimple[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const courseId = params.courseId as string;
    const moduleId = searchParams.get('moduleId');

    // 1. CARGAR MATERIALES (Con Axios)
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            router.push('/login');
            return;
        }
        if (!moduleId) {
            toast.error("Error crítico: No se especificó el módulo.");
            return;
        }

        const fetchMaterials = async () => {
            try {
                // Axios gestiona la URL y el Token
                const res = await api.get(`/modulos/${moduleId}/materiales`);
                setMaterialesDisponibles(res.data);
            } catch (err) {
                console.error(err);
                toast.error("No se pudieron cargar los materiales para sugerencias.");
            }
        };

        fetchMaterials();
    }, [moduleId, router]);

    // --- MANEJO DE ESTADO (Lógica local, se mantiene igual) ---

    const addQuestion = () => {
        setQuestions([...questions, {
            textoPregunta: "",
            respuestas: [{ textoRespuesta: "", esCorrecta: true }, { textoRespuesta: "", esCorrecta: false }],
            materialesSugeridosIds: []
        }]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length === 1) {
            toast.warning("El examen debe tener al menos una pregunta.");
            return;
        }
        const newQ = [...questions];
        newQ.splice(index, 1);
        setQuestions(newQ);
    };

    const handleQuestionTextChange = (index: number, text: string) => {
        const newQ = [...questions];
        newQ[index].textoPregunta = text;
        setQuestions(newQ);
    };

    const handleMaterialChange = (index: number, materialId: string) => {
        const newQ = [...questions];
        newQ[index].materialesSugeridosIds = materialId && materialId !== "none" ? [materialId] : [];
        setQuestions(newQ);
    };

    const addAnswer = (qIndex: number) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].respuestas.length >= MAX_OPTIONS) return;
        newQuestions[qIndex].respuestas.push({ textoRespuesta: "", esCorrecta: false });
        setQuestions(newQuestions);
    };

    const removeAnswer = (qIndex: number, aIndex: number) => {
        const newQ = [...questions];
        if (newQ[qIndex].respuestas.length <= 2) return;
        newQ[qIndex].respuestas.splice(aIndex, 1);
        setQuestions(newQ);
    };

    const handleAnswerTextChange = (qIndex: number, aIndex: number, text: string) => {
        const newQ = [...questions];
        newQ[qIndex].respuestas[aIndex].textoRespuesta = text;
        setQuestions(newQ);
    };

    const handleCorrectAnswerChange = (qIndex: number, aIndex: number) => {
        const newQ = [...questions];
        newQ[qIndex].respuestas.forEach((ans, idx) => {
            ans.esCorrecta = (idx === aIndex);
        });
        setQuestions(newQ);
    };

    // --- ENVÍO (Con Axios) ---
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // VALIDACIONES BÁSICAS
        if (!titulo.trim()) { toast.warning("El título es obligatorio."); return; }

        // Validar que todas las preguntas tengan texto
        const invalidQ = questions.find(q => !q.textoPregunta.trim());
        if(invalidQ) { toast.warning("Todas las preguntas deben tener un enunciado."); return; }

        setIsLoading(true);

        const evaluationData = { titulo, preguntas: questions };

        try {
            // Petición POST limpia
            await api.post(`/modulos/${moduleId}/evaluaciones`, evaluationData);

            toast.success("Examen creado exitosamente");
            router.push(`/instructor/courses/${courseId}`);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                toast.error(err.response.data.error || "Error al guardar el examen.");
            } else {
                toast.error("Error de conexión con el servidor.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!moduleId) return null;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-4xl min-h-screen pb-24">

            {/* BOTÓN VOLVER */}
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="pl-0 text-slate-500 hover:text-slate-900">
                    <Link href={`/instructor/courses/${courseId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar y volver
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-100 p-2 rounded-xl">
                    <ClipboardList className="h-8 w-8 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Crear Examen</h1>
                    <p className="text-slate-500 text-sm">Configura preguntas de opción múltiple para evaluar a tus estudiantes.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                <Card className="border-t-4 border-t-emerald-500 shadow-md border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-slate-800">Configuración General</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="titulo" className="font-semibold text-slate-700">Título del Examen</Label>
                            <Input
                                id="titulo"
                                placeholder="Ej: Examen Final del Módulo 1"
                                required
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                className="text-lg font-medium border-slate-200 focus-visible:ring-emerald-500 h-12"
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* --- LISTA DE PREGUNTAS --- */}
                <div className="space-y-6">
                    {questions.map((question, qIndex) => (
                        <div key={qIndex} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative group hover:shadow-md transition-shadow hover:border-emerald-200">

                            {/* Cabecera de Pregunta */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-xs uppercase">Pregunta {qIndex + 1}</span>
                                </div>
                                {questions.length > 1 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} className="text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label="Eliminar pregunta">
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>

                            {/* Texto Pregunta */}
                            <div className="mb-6">
                                <Label className="mb-2 block text-slate-700 font-medium">Enunciado de la pregunta</Label>
                                <Textarea
                                    placeholder="¿Cuál es la función principal de...?"
                                    value={question.textoPregunta}
                                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                                    required
                                    className="resize-none bg-slate-50 focus:bg-white border-slate-200 focus-visible:ring-emerald-500 min-h-[80px]"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* --- MATERIAL SUGERIDO --- */}
                            <div className="mb-6 p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
                                <Label className="text-amber-800 font-semibold mb-1 flex items-center gap-2 text-sm">
                                    <BookOpen size={14} /> Material de Refuerzo (Opcional)
                                </Label>
                                <p className="text-xs text-amber-700/70 mb-3">
                                    Si el estudiante falla, se le sugerirá repasar este contenido.
                                </p>
                                <Select
                                    disabled={isLoading}
                                    onValueChange={(val) => handleMaterialChange(qIndex, val)}
                                    value={question.materialesSugeridosIds[0] || "none"}
                                >
                                    <SelectTrigger className="bg-white border-amber-200 focus:ring-amber-500 h-9">
                                        <SelectValue placeholder="Seleccionar material..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Sin material sugerido --</SelectItem>
                                        {materialesDisponibles.map(mat => (
                                            <SelectItem key={mat.id} value={mat.id}>
                                                <span className="flex items-center gap-2">
                                                    {mat.tipo === 'VIDEO' ? '🎥' : '📄'}
                                                    <span className="truncate max-w-[200px]">{mat.titulo}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Respuestas */}
                            <div className="pl-4 border-l-2 border-slate-100 space-y-4">
                                <Label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-600"/>
                                    Opciones de Respuesta (Marca la correcta)
                                </Label>

                                <RadioGroup
                                    onValueChange={(val) => handleCorrectAnswerChange(qIndex, parseInt(val))}
                                    defaultValue={question.respuestas.findIndex(r => r.esCorrecta).toString()}
                                    className="space-y-3"
                                >
                                    {question.respuestas.map((answer, aIndex) => (
                                        <div key={aIndex} className="flex items-center gap-3 group/answer">
                                            <RadioGroupItem
                                                value={String(aIndex)}
                                                id={`q${qIndex}-a${aIndex}`}
                                                className="mt-1 border-slate-300 text-emerald-600"
                                            />

                                            <div className="flex-1 relative">
                                                <Input
                                                    placeholder={`Opción ${aIndex + 1}`}
                                                    value={answer.textoRespuesta}
                                                    onChange={(e) => handleAnswerTextChange(qIndex, aIndex, e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                    className={`transition-all ${answer.esCorrecta
                                                        ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/30 font-medium text-emerald-900"
                                                        : "border-slate-200"}`}
                                                />
                                                {answer.esCorrecta && (
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                        CORRECTA
                                                    </span>
                                                )}
                                            </div>

                                            {question.respuestas.length > 2 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeAnswer(qIndex, aIndex)} className="text-slate-300 hover:text-red-500 h-8 w-8 opacity-0 group-hover/answer:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </RadioGroup>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addAnswer(qIndex)}
                                    className="mt-2 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 h-8 text-xs font-medium"
                                    disabled={question.respuestas.length >= MAX_OPTIONS}
                                >
                                    <Plus size={14} className="mr-1"/>
                                    {question.respuestas.length >= MAX_OPTIONS ? 'Máximo de opciones alcanzado' : 'Añadir otra opción'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    className="w-full border-dashed border-2 py-8 text-slate-500 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all font-semibold"
                    disabled={isLoading}
                >
                    <Plus size={20} className="mr-2"/> Añadir Nueva Pregunta
                </Button>

                {/* FOOTER FIJO */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg z-50">
                    <div className="container mx-auto max-w-4xl flex justify-end gap-4">
                        <Button variant="ghost" asChild disabled={isLoading} className="text-slate-600">
                            <Link href={`/instructor/courses/${courseId}`}>Cancelar</Link>
                        </Button>
                        <Button type="submit" size="lg" className="min-w-[200px] bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Guardando...</> : <><Save className="mr-2 h-4 w-4"/> Guardar Examen</>}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}