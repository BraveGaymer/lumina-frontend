"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { GraduationCap, Eye, EyeOff, Loader2, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

export default function RegisterInstructorPage() {

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

        // 1. Limpiamos errores
        const newErrors = { nombre: "", email: "", password: "", confirmPassword: "", general: "" };
        let isValid = true;

        // 2. Validaciones Locales
        if (!nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio.";
            isValid = false;
        } else if (!validateName(nombre)) {
            newErrors.nombre = "Solo se permiten letras y espacios.";
            isValid = false;
        }

        if (!validateEmail(email)) {
            newErrors.email = "Ingresa un correo profesional válido.";
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
            toast.warning("Por favor corrige los errores antes de continuar.");
            return;
        }

        // 3. Enviar al Backend (Con Axios)
        try {
            // Petición POST limpia
            await api.post('/auth/register/instructor', {
                nombre: nombre.trim(),
                correo: email.trim(),
                contrasena: password
            });

            // ÉXITO
            toast.success("¡Solicitud enviada! Revisa tu correo para confirmar tu cuenta.");

            // Redirección con pausa para leer el mensaje
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const msg = err.response.data.message || err.response.data.error || 'Error al registrar instructor.';

                toast.error(msg);
                setErrors(prev => ({ ...prev, general: msg }));

                // Si el error es específico de un campo (si tu backend lo soporta así)
                if (err.response.data.campo === 'email') {
                    setErrors(prev => ({ ...prev, email: msg }));
                }
            } else {
                toast.error("Error de conexión con el servidor.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
            <Card className="w-full max-w-md shadow-xl border-slate-200">

                <CardHeader className="text-center space-y-2">
                    {/* LOGO LUMINA + DISTINTIVO INSTRUCTOR */}
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <div className="bg-slate-900 p-2 rounded-xl">
                            <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400" aria-hidden="true" />
                        </div>
                        <div className="bg-amber-100 p-2 rounded-xl border border-amber-200">
                            <GraduationCap className="h-6 w-6 text-amber-700" aria-hidden="true" />
                        </div>
                    </div>

                    <CardTitle className="text-2xl font-bold text-slate-900">Registro de Instructor</CardTitle>
                    <CardDescription>Comparte tu conocimiento con la comunidad Lumina.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Completo</Label>
                            <Input
                                id="nombre"
                                type="text"
                                placeholder="Tu nombre real"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className={errors.nombre ? "border-red-500 focus-visible:ring-red-500" : ""}
                                aria-invalid={!!errors.nombre}
                                aria-describedby={errors.nombre ? "nombre-error" : undefined}
                            />
                            {errors.nombre && (
                                <p id="nombre-error" className="text-red-500 text-xs font-medium" role="alert">{errors.nombre}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Profesional</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="instructor@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs font-medium" role="alert">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
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
                                    Incluye mayúsculas, minúsculas, números y símbolos.
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
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
                            aria-label={isLoading ? "Procesando registro..." : "Registrarse como Instructor"}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Registrarse como Instructor"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 border-t bg-slate-50/50 rounded-b-xl">
                    <div className="text-sm text-center">
                        <span className="text-slate-600">¿Ya tienes cuenta? </span>
                        <Link href="/login" className="font-bold text-slate-900 hover:underline">
                            Inicia sesión
                        </Link>
                    </div>

                    {/* Link de vuelta a estudiante */}
                    <div className="w-full pt-2">
                        <Button
                            variant="ghost"
                            className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            asChild
                        >
                            <Link href="/register" aria-label="Ir a registro de estudiantes">
                                <BookOpen className="mr-2 h-4 w-4"/>
                                ¿Eres estudiante? Regístrate aquí
                            </Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}