"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

export default function RegisterPage() {

    // --- ESTADOS ---
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Estados de UI
    const [errors, setErrors] = useState({
        nombre: "",
        email: "",
        password: "",
        confirmPassword: "",
        general: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    // --- VALIDACIONES ---
    const validateName = (name: string) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

    // --- MANEJO DEL ENVÍO ---
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        // 1. Limpiamos errores previos
        const newErrors = { nombre: "", email: "", password: "", confirmPassword: "", general: "" };
        let isValid = true;

        // 2. Validaciones Locales
        if (!nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio.";
            isValid = false;
        } else if (!validateName(nombre)) {
            newErrors.nombre = "El nombre solo puede contener letras y espacios.";
            isValid = false;
        }

        if (!validateEmail(email)) {
            newErrors.email = "Ingresa un correo válido.";
            isValid = false;
        }

        if (!validatePassword(password)) {
            newErrors.password = "Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.";
            isValid = false;
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden.";
            isValid = false;
        }

        setErrors(newErrors);

        if (!isValid) {
            setIsLoading(false);
            toast.warning("Por favor corrige los errores en el formulario.");
            return;
        }

        // 3. Enviar al Backend (Con Axios)
        try {
            // Petición POST limpia
            await api.post('/auth/register', {
                nombre: nombre.trim(),
                correo: email.trim(),
                contrasena: password
            });

            // ÉXITO (Si Axios no lanza error, es un 200 OK)
            toast.success("¡Registro exitoso! Redirigiendo al login...");

            setTimeout(() => {
                router.push('/login');
            }, 1500);

        } catch (err: any) {
            console.error(err);
            // Manejo de errores de Axios
            if (err.response && err.response.data) {
                const errorData = err.response.data;

                // Errores específicos de campos que devuelve el backend
                if (errorData.campo === 'email') {
                    setErrors(prev => ({ ...prev, email: errorData.mensaje }));
                    toast.error("El correo ya está registrado.");
                } else if (errorData.campo === 'nombre') {
                    setErrors(prev => ({ ...prev, nombre: errorData.mensaje }));
                } else {
                    // Error genérico del backend
                    toast.error(errorData.mensaje || errorData.error || 'Error al registrarse.');
                }
            } else {
                // Error de red (Servidor caído o sin internet)
                toast.error("Error de conexión con el servidor AWS.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4 py-8">
            <Card className="w-full max-w-md shadow-xl border-slate-200">

                <CardHeader className="text-center space-y-2">
                    {/* LOGO LUMINA */}
                    <div className="flex justify-center mb-2">
                        <div className="bg-slate-900 p-2 rounded-xl">
                            <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400" aria-hidden="true" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Crear Cuenta</CardTitle>
                    <CardDescription>Únete a la comunidad de Lumina.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Completo</Label>
                            <Input
                                id="nombre"
                                type="text"
                                placeholder="Ej. Juan Pérez"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className={errors.nombre ? "border-red-500 focus-visible:ring-red-500" : ""}
                                aria-invalid={!!errors.nombre}
                                aria-describedby={errors.nombre ? "nombre-error" : undefined}
                            />
                            {errors.nombre && (
                                <p id="nombre-error" className="text-red-500 text-xs font-medium" role="alert">
                                    {errors.nombre}
                                </p>
                            )}
                        </div>

                        {/* Correo */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs font-medium" role="alert">{errors.email}</p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                                    aria-invalid={!!errors.password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-900 focus:outline-none rounded"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
                                </button>
                            </div>

                            {errors.password ? (
                                <p className="text-red-500 text-xs font-medium" role="alert">{errors.password}</p>
                            ) : (
                                <p className="text-[10px] text-gray-500">
                                    Requiere mayúscula, minúscula, número y símbolo.
                                </p>
                            )}
                        </div>

                        {/* Confirmar Contraseña */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repite tu contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
                                aria-invalid={!!errors.confirmPassword}
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs font-medium" role="alert">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold mt-4"
                            disabled={isLoading}
                            aria-label={isLoading ? "Creando cuenta..." : "Registrarse en la plataforma"}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Registrarse"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 border-t bg-slate-50/50 rounded-b-xl">
                    <div className="text-sm text-center">
                        <span className="text-slate-600">¿Ya tienes una cuenta? </span>
                        <Link href="/login" className="font-bold text-slate-900 hover:underline">
                            Inicia sesión
                        </Link>
                    </div>

                    {/* Botón de Registro Instructor */}
                    <div className="w-full pt-2">
                        <Button
                            variant="outline"
                            className="w-full border-amber-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                            asChild
                        >
                            <Link href="/register-instructor" aria-label="Ir a registro de instructores">
                                <CheckCircle2 className="mr-2 h-4 w-4"/>
                                ¿Quieres enseñar? Regístrate aquí
                            </Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}