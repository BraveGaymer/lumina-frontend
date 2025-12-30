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
import { Trash2, Plus, Loader2, Save, ArrowLeft, BookOpen, ClipboardList, CheckCircle2 } from "lucide-react";
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

const MAX_OPTIONS = 6;

export default function EditEvaluationPage() {
    const [titulo, setTitulo] = useState("");
    const [questions, setQuestions] = useState<QuestionState[]>([]);
    const [materialesDisponibles, setMaterialesDisponibles] = useState<MaterialSimple[]>([]);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const courseId = params.courseId as string;
    const evaluationId = params.evaluationId as string;
    const moduleId = searchParams.get('moduleId');

    // --- 1. CARGAR DATOS (Con Axios y Paralelismo) ---
    useEffect(() => {
        const loadAllData = async () => {
            // Verificación básica (Axios hará la real)
            if (!localStorage.getItem('jwtToken')) {
                router.push('/login');
                return;
            }
            if (!moduleId || !evaluationId) {
                toast.error("Error: URL incompleta (falta ID).");
                return;
            }

            try {
                // Hacemos ambas peticiones en paralelo para cargar más rápido
                const [resMat, resEval] = await Promise.all([
                    api.get(`/modulos/${moduleId}/materiales`),
                    api.get(`/modulos/${moduleId}/evaluaciones/${evaluationId}/editar`)
                ]);

                // 1. Materiales Disponibles
                setMaterialesDisponibles(resMat.data);

                // 2. Datos del Examen
                const data = resEval.data;
                setTitulo(data.titulo);

                // Mapeo cuidadoso de los datos recibidos al formato del estado local
                setQuestions(data.preguntas.map((q: any) => ({
                    textoPregunta: q.textoPregunta,
                    respuestas: q.respuestas.map((r: any) => ({
                        textoRespuesta: r.textoRespuesta,
                        esCorrecta: r.esCorrecta
                    })),
                    // Si viene el objeto completo de materiales, extraemos solo IDs
                    materialesSugeridosIds: q.materialesSugeridos
                        ? q.materialesSugeridos.map((m: any) => m.id)
                        : []
                })));

            } catch (err: any) {
                console.error(err);
                if (err.response && err.response.status === 404) {
                    toast.error("El examen no existe.");
                } else {
                    toast.error("Error al cargar la información del examen.");
                }
            } finally {
                setIsLoadingData(false);
            }
        };

        loadAllData();
    }, [moduleId, evaluationId, router]);


    // --- 2. GESTIÓN DE ESTADO LOCAL (Se mantiene igual) ---

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
        newQ[index].materialesSugeridosIds = (materialId && materialId !== "none") ? [materialId] : [];
        setQuestions(newQ);
    };

    const addAnswer = (qIndex: number) => {
        const newQ = [...questions];
        if (newQ[qIndex].respuestas.length >= MAX_OPTIONS) return;
        newQ[qIndex].respuestas.push({ textoRespuesta: "", esCorrecta: false });
        setQuestions(newQ);
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

    // --- 3. GUARDAR CAMBIOS (PUT con Axios) ---
    const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Validaciones
        if (!titulo.trim()) { toast.warning("El título es obligatorio."); return; }
        const invalidQ = questions.find(q => !q.textoPregunta.trim());
        if(invalidQ) { toast.warning("Todas las preguntas deben tener un enunciado."); return; }

        setIsSaving(true);

        const evaluationData = { titulo, preguntas: questions };

        try {
            // Petición PUT limpia
            await api.put(`/modulos/${moduleId}/evaluaciones/${evaluationId}`, evaluationData);

            toast.success("Examen actualizado correctamente.");
            router.push(`/instructor/courses/${courseId}`);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                toast.error(err.response.data.error || "Error al actualizar.");
            } else {
                toast.error("Error de conexión con el servidor.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingData) return <div className="flex justify-center items-center h-screen text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando examen...</div>;
    if (!moduleId) return <div className="p-10 text-center text-red-500">Error: Enlace roto (falta moduleId).</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-4xl min-h-screen pb-24">

            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="pl-0 text-slate-500 hover:text-slate-900">
                    <Link href={`/instructor/courses/${courseId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar edición
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-100 p-2 rounded-xl">
                    <ClipboardList className="h-8 w-8 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Editar Examen</h1>
                    <p className="text-slate-500 text-sm">Modifica las preguntas y respuestas de esta evaluación.</p>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-8">

                {/* CONFIGURACIÓN GENERAL */}
                <Card className="border-t-4 border-t-emerald-500 shadow-md border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-slate-800">Configuración</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="titulo" className="font-semibold text-slate-700">Título del Examen</Label>
                            <Input
                                id="titulo"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                required
                                disabled={isSaving}
                                className="text-lg font-medium border-slate-200 focus-visible:ring-emerald-500 h-12"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* LISTA DE PREGUNTAS */}
                <div className="space-y-6">
                    {questions.map((question, qIndex) => (
                        <div key={qIndex} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative group hover:shadow-md transition-shadow hover:border-emerald-200">

                            {/* CABECERA PREGUNTA */}
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

                            {/* TEXTO PREGUNTA */}
                            <div className="mb-6">
                                <Label className="mb-2 block text-slate-700 font-medium">Enunciado</Label>
                                <Textarea
                                    value={question.textoPregunta}
                                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                                    required
                                    disabled={isSaving}
                                    className="resize-none bg-slate-50 focus:bg-white border-slate-200 focus-visible:ring-emerald-500 min-h-[80px]"
                                />
                            </div>

                            {/* SELECTOR MATERIAL */}
                            <div className="mb-6 p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
                                <Label className="text-amber-800 font-semibold mb-1 flex items-center gap-2 text-sm">
                                    <BookOpen size={14} /> Material de Retroalimentación
                                </Label>
                                <p className="text-xs text-amber-700/70 mb-3">
                                    Si el estudiante falla, se le sugerirá este material.
                                </p>
                                <Select
                                    disabled={isSaving}
                                    onValueChange={(val) => handleMaterialChange(qIndex, val)}
                                    value={question.materialesSugeridosIds?.[0] || "none"}
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

                            {/* RESPUESTAS */}
                            <div className="pl-4 border-l-2 border-slate-100 space-y-4">
                                <Label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-600"/>
                                    Respuestas (Marca la correcta)
                                </Label>

                                <RadioGroup
                                    value={question.respuestas.findIndex(r => r.esCorrecta).toString()}
                                    onValueChange={(val) => handleCorrectAnswerChange(qIndex, parseInt(val))}
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
                                                    value={answer.textoRespuesta}
                                                    onChange={(e) => handleAnswerTextChange(qIndex, aIndex, e.target.value)}
                                                    required
                                                    disabled={isSaving}
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
                                    disabled={isSaving || question.respuestas.length >= MAX_OPTIONS}
                                    className="mt-2 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 h-8 text-xs font-medium"
                                >
                                    <Plus size={14} className="mr-1"/>
                                    {question.respuestas.length >= MAX_OPTIONS ? 'Máximo alcanzado' : 'Añadir Opción'}
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
                    disabled={isSaving}
                >
                    <Plus size={20} className="mr-2"/> Añadir Nueva Pregunta
                </Button>

                {/* FOOTER FLOTANTE */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg z-50">
                    <div className="container mx-auto max-w-4xl flex justify-end gap-4">
                        <Button variant="ghost" asChild disabled={isSaving} className="text-slate-600">
                            <Link href={`/instructor/courses/${courseId}`}>Cancelar</Link>
                        </Button>
                        <Button type="submit" size="lg" className="min-w-[200px] bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg" disabled={isSaving}>
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Guardando...</> : <><Save className="mr-2 h-4 w-4"/> Guardar Cambios</>}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}