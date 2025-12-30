"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

function VerifyEmailContent() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("Estamos validando tu enlace...");
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage("El enlace de verificación no es válido o falta el token.");
            toast.error("Enlace incompleto.");
            return;
        }

        const verify = async () => {
            try {
                // Petición POST limpia con Axios
                await api.post('/auth/verify-email', { token });

                // Si no hay error, es un éxito (200 OK)
                setStatus('success');
                toast.success("¡Cuenta verificada exitosamente!");

            } catch (error: any) {
                setStatus('error');
                console.error(error);

                if (error.response && error.response.data) {
                    const msg = error.response.data.error || error.response.data.mensaje || "El enlace ha expirado o ya fue utilizado.";
                    setMessage(msg);
                } else {
                    setMessage("No pudimos verificar tu cuenta. Error de conexión.");
                }

                toast.error("Error en la verificación.");
            }
        };

        // Ejecutamos la verificación solo si hay token
        if (token) {
            verify();
        }
    }, [token]);

    return (
        <Card className="w-full max-w-md text-center shadow-xl border-slate-200">
            <CardHeader>
                {/* LOGO LUMINA */}
                <div className="flex justify-center mb-4">
                    <div className="bg-slate-900 p-3 rounded-xl shadow-md">
                        <Sparkles className="h-8 w-8 text-amber-400 fill-amber-400" aria-hidden="true" />
                    </div>
                </div>

                {/* ICONO DE ESTADO */}
                <div className="flex justify-center mb-4 animate-in zoom-in duration-300">
                    {status === 'loading' && <Loader2 className="h-16 w-16 animate-spin text-slate-400" aria-label="Cargando" />}
                    {status === 'success' && <CheckCircle2 className="h-16 w-16 text-green-500" aria-label="Éxito" />}
                    {status === 'error' && <XCircle className="h-16 w-16 text-red-500" aria-label="Error" />}
                </div>

                {/* TÍTULO Y MENSAJE */}
                <div aria-live="polite" className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-slate-900">
                        {status === 'loading' && "Verificando Cuenta..."}
                        {status === 'success' && "¡Cuenta Verificada!"}
                        {status === 'error' && "Verificación Fallida"}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {status === 'success'
                            ? "Tu correo ha sido confirmado correctamente. Ya tienes acceso completo a Lumina."
                            : message}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="pb-8">
                {status === 'success' && (
                    <Button
                        onClick={() => router.push('/login')}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg transition-all hover:-translate-y-0.5"
                        aria-label="Ir a la página de inicio de sesión"
                    >
                        Iniciar Sesión
                    </Button>
                )}

                {status === 'error' && (
                    <Button
                        onClick={() => router.push('/login')}
                        variant="outline"
                        className="w-full border-slate-300 hover:bg-slate-50 text-slate-700"
                        aria-label="Volver a la página de inicio de sesión"
                    >
                        Volver al Inicio
                    </Button>
                )}

                {status === 'loading' && (
                    <p className="text-sm text-slate-400 animate-pulse">Por favor espera un momento...</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Suspense fallback={
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
                    <span className="text-slate-600 font-medium">Cargando verificación...</span>
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}