"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// Componente interno que maneja la lógica y params
function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    // Validación inicial del token (visual)
    useEffect(() => {
        if (!token) {
            setStatus('error');
            toast.error("El enlace de recuperación es inválido o ha expirado.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación local
        if (password !== confirmPassword) {
            toast.warning("Las contraseñas no coinciden.");
            return;
        }
        if (password.length < 8) {
            toast.warning("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        setIsLoading(true);

        try {
            // Petición POST limpia con Axios
            await api.post('/auth/reset-password', {
                token: token,
                nuevaContrasena: password
            });

            // ÉXITO
            setStatus('success');
            toast.success("¡Contraseña actualizada correctamente!");

            // Redirección automática
            setTimeout(() => router.push('/login'), 3000);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const msg = err.response.data.message || err.response.data.error || "El enlace ha expirado o es inválido.";
                toast.error(msg);
            } else {
                toast.error("Error de conexión al restablecer contraseña.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // VISTA DE ÉXITO
    if (status === 'success') {
        return (
            <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">¡Contraseña Actualizada!</h3>
                    <p className="text-slate-600 text-sm">
                        Ya puedes acceder a tu cuenta con tu nueva clave.
                    </p>
                </div>
                <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                    <Link href="/login">Ir a Iniciar Sesión</Link>
                </Button>
            </div>
        );
    }

    // VISTA DE FORMULARIO
    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            {/* NUEVA CONTRASEÑA */}
            <div className="space-y-2">
                <Label htmlFor="pass">Nueva Contraseña</Label>
                <div className="relative">
                    <Input
                        id="pass"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pr-10"
                        placeholder="Mínimo 8 caracteres"
                        aria-required="true"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-900 rounded focus:outline-none"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* CONFIRMAR CONTRASEÑA */}
            <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar Contraseña</Label>
                <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    aria-required="true"
                />
            </div>

            {status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded text-center" role="alert">
                    <p className="text-red-600 text-sm font-medium">Token inválido o expirado.</p>
                    <Link href="/forgot-password" className="text-xs text-red-700 underline mt-1 block hover:text-red-800">
                        Solicitar nuevo enlace
                    </Link>
                </div>
            )}

            <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold mt-2"
                disabled={isLoading || status === 'error'}
                aria-label={isLoading ? "Guardando cambios..." : "Cambiar mi contraseña"}
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cambiar Contraseña"}
            </Button>
        </form>
    );
}

// PÁGINA PRINCIPAL
export default function ResetPasswordPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">

                <CardHeader className="text-center space-y-2">
                    {/* LOGO LUMINA + ICONO CANDADO */}
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <div className="bg-slate-900 p-2 rounded-xl">
                            <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400" aria-hidden="true" />
                        </div>
                        <div className="bg-slate-100 p-2 rounded-xl border border-slate-200">
                            <Lock className="h-6 w-6 text-slate-700" aria-hidden="true" />
                        </div>
                    </div>

                    <CardTitle className="text-2xl font-bold text-slate-900">Crear Nueva Contraseña</CardTitle>
                    <CardDescription>Establece una nueva clave segura para tu cuenta.</CardDescription>
                </CardHeader>

                <CardContent>
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>Verificando enlace...</p>
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}