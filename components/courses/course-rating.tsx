"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

interface CourseRatingProps {
    courseId: string;
    onRatingSuccess?: () => void;
}

// Etiquetas para dar feedback visual al usuario mientras selecciona
const ratingLabels: { [key: number]: string } = {
    1: "Malo",
    2: "Regular",
    3: "Bueno",
    4: "Muy Bueno",
    5: "Excelente"
};

export function CourseRating({ courseId, onRatingSuccess }: CourseRatingProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.warning("Por favor selecciona una calificación de estrellas.");
            return;
        }

        setIsLoading(true);

        try {
            // Petición POST con Axios
            await api.post(`/cursos/${courseId}/ratings`, {
                ratingValue: rating,
                comment: comment
            });

            toast.success("¡Gracias por tu opinión!", {
                description: "Tu valoración ayuda a otros estudiantes."
            });

            setIsOpen(false);
            if (onRatingSuccess) onRatingSuccess();

        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.error || "Error al enviar la calificación.");
            } else {
                toast.error("Error de conexión.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                    aria-label="Abrir modal para calificar curso"
                >
                    <Star className="w-4 h-4 mr-2 fill-amber-700" />
                    Calificar Curso
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] border-slate-200 shadow-xl">
                <DialogHeader className="items-center text-center">
                    <div className="bg-amber-50 p-3 rounded-full mb-2">
                        <MessageSquarePlus className="h-6 w-6 text-amber-500" />
                    </div>
                    <DialogTitle className="text-xl text-slate-900">Califica tu experiencia</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        ¿Qué te pareció el contenido? Sé honesto, tu opinión es valiosa.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* ESTRELLAS INTERACTIVAS */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex justify-center space-x-1" role="group" aria-label="Selección de estrellas">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-full p-1 transition-transform hover:scale-110 active:scale-95"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    aria-label={`Calificar con ${star} estrellas`}
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors duration-200 ${
                                            star <= (hoverRating || rating)
                                                ? "fill-amber-400 text-amber-400"
                                                : "fill-slate-100 text-slate-200"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {/* Etiqueta dinámica */}
                        <div className="h-5 text-sm font-bold text-amber-600 animate-in fade-in slide-in-from-bottom-1">
                            {ratingLabels[hoverRating || rating] || ""}
                        </div>
                    </div>

                    {/* CAMPO DE COMENTARIO */}
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Escribe un comentario (opcional)... ¿Qué fue lo que más te gustó?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] border-slate-200 focus-visible:ring-amber-500 resize-none text-slate-700"
                            aria-label="Comentario sobre el curso"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isLoading ? "Enviando..." : "Enviar Calificación"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}