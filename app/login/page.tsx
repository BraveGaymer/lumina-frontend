"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner"; // IMPORTAMOS SONNER
import api from "@/lib/axios";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validación básica
        if (!email || !password) {
            toast.warning("Por favor completa todos los campos");
            setLoading(false);
            return;
        }

        try {
            // CAMBIO CLAVE: Usamos 'api' en lugar de 'fetch' y quitamos 'localhost'
            const response = await api.post("/auth/login", {
                correo: email,
                contrasena: password
            });

            // Si Axios no lanza error, significa que el login fue EXITOSO
            const data = response.data;
            localStorage.setItem("jwtToken", data.token);

            toast.success("¡Bienvenido de nuevo!");

            // --- LÓGICA DE REDIRECCIÓN (Se mantiene igual) ---
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            const role = payload.role || (payload.roles && payload.roles[0]) || "";

            switch (role) {
                case "ROLE_SUPER_ROOT":
                    router.push("/root");
                    break;
                case "ROLE_ADMIN":
                    router.push("/admin");
                    break;
                case "ROLE_INSTRUCTOR":
                    router.push("/instructor");
                    break;
                default:
                    router.push("/courses");
                    break;
            }

        } catch (err: any) {
            // CAPTURA DE ERRORES (Adaptada para Axios)
            console.error("Error de conexión:", err);

            if (err.response && err.response.data) {
                // Si el servidor respondió con un error (ej. 401, 403)
                const errorData = err.response.data;
                let mensajeError = errorData.mensaje || errorData.error || "Credenciales incorrectas";

                // Traducción de errores comunes
                if (mensajeError === "User is disabled") {
                    mensajeError = "Tu cuenta está desactivada. Verifica tu correo.";
                } else if (mensajeError === "Bad credentials") {
                    mensajeError = "Correo o contraseña incorrectos.";
                }
                toast.error(mensajeError);
            } else {
                // Si ni siquiera pudo conectar (Servidor AWS apagado o sin internet)
                toast.error("No se pudo conectar con el servidor AWS.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">

                <CardHeader className="space-y-3 text-center">
                    {/* LOGO LUMINA EN EL LOGIN */}
                    <div className="flex justify-center mb-2">
                        <div className="bg-slate-900 p-2 rounded-xl">
                            <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400" aria-hidden="true" />
                        </div>
                    </div>

                    <CardTitle className="text-2xl font-bold text-slate-900">Iniciar Sesión</CardTitle>
                    <CardDescription>
                        Ingresa a Lumina para continuar tu aprendizaje.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                aria-required="true"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                                    aria-label="Recuperar contraseña olvidada"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    aria-required="true"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all"
                            disabled={loading}
                            aria-label={loading ? "Iniciando sesión..." : "Iniciar sesión en la plataforma"}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ingresar"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 text-center border-t bg-slate-50/50 p-6 rounded-b-xl">
                    <p className="text-sm text-slate-600">
                        ¿No tienes una cuenta? <Link href="/register" className="text-slate-900 hover:underline font-bold" aria-label="Crear una cuenta nueva">Regístrate gratis</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}