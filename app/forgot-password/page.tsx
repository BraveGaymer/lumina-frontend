"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Importamos tu configuración

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false); // Nuevo estado para controlar la vista de éxito

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.warning("Por favor ingresa tu correo electrónico.");
            return;
        }

        setIsLoading(true);

        try {
            // Petición POST limpia con Axios
            await api.post('/auth/forgot-password', { correo: email });

            // ÉXITO
            toast.success("Enlace enviado correctamente.");
            setIsSubmitted(true); // Cambiamos la vista

        } catch (err: any) {
            console.error(err);
            // Nota de seguridad: En "Recuperar contraseña" es buena práctica
            // no decir explícitamente si el correo existe o no para evitar enumeración de usuarios.
            // Por eso, un mensaje genérico de error de conexión está bien.
            if (err.response && err.response.status === 404) {
                // Opcional: Si quieres ser específico (menos seguro)
                // toast.error("Ese correo no está registrado.");
                // Pero por seguridad, a veces se simula éxito o se da error genérico:
                toast.error("No pudimos procesar la solicitud. Verifica el correo.");
            } else {
                toast.error("Ocurrió un error de conexión. Inténtalo más tarde.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">

                <CardHeader className="text-center space-y-2">
                    {/* LOGO LUMINA (Solo visible si no se ha enviado aún para mantener limpieza) */}
                    {!isSubmitted && (
                        <div className="flex justify-center mb-2">
                            <div className="bg-slate-900 p-2 rounded-xl">
                                <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400" aria-hidden="true" />
                            </div>
                        </div>
                    )}

                    <CardTitle className="text-2xl font-bold text-slate-900">
                        {isSubmitted ? "¡Correo Enviado!" : "Recuperar Contraseña"}
                    </CardTitle>
                    <CardDescription>
                        {isSubmitted
                            ? "Revisa tu bandeja de entrada para continuar."
                            : "Ingresa tu correo asociado y te enviaremos un enlace de recuperación."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {!isSubmitted ? (
                        /* --- FORMULARIO DE ENVÍO --- */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true"/>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        className="pl-9" // Espacio para el ícono
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        aria-label="Correo electrónico para recuperación"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                                disabled={isLoading}
                                aria-label={isLoading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Enlace"}
                            </Button>
                        </form>
                    ) : (
                        /* --- VISTA DE ÉXITO --- */
                        <div className="text-center py-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-green-100 p-3">
                                    <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden="true" />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600">
                                <p>Hemos enviado un enlace a <strong>{email}</strong>.</p>
                                <p className="mt-2 text-xs text-slate-500">
                                    Si no lo encuentras, revisa tu carpeta de Spam.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="justify-center border-t bg-slate-50/50 rounded-b-xl pt-6">
                    <Button variant="link" asChild className="text-slate-600 hover:text-slate-900">
                        <Link href="/login" className="flex items-center gap-2" aria-label="Volver al inicio de sesión">
                            <ArrowLeft size={16} aria-hidden="true" /> Volver al Login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}