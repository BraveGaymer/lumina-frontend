"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

export default function RegisterAdminPage() {

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
            newErrors.email = "Ingresa un correo corporativo válido.";
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
            toast.warning("Por favor corrige los errores antes de enviar.");
            return;
        }

        // 3. Enviar al Backend (Con Axios)
        try {
            // Petición POST limpia
            await api.post('/auth/register-admin', {
                nombre: nombre.trim(),
                correo: email.trim(),
                contrasena: password
            });

            // ÉXITO (Con mensaje especial)
            toast.success("¡Solicitud enviada correctamente!", {
                description: "Tu cuenta debe ser aprobada por un Super Usuario antes de poder ingresar.",
                duration: 5000, // Duración extra para leer
            });

            // Redirección con pausa para leer el mensaje
            setTimeout(() => {
                router.push('/login');
            }, 5000);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                const msg = errorData.mensaje || errorData.error || 'Error al procesar la solicitud.';

                toast.error(msg);
                setErrors(prev => ({ ...prev, general: msg }));
            } else {
                toast.error("Error de conexión con el servidor.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">

                <CardHeader className="text-center space-y-2">
                    {/* LOGO LUMINA + DISTINTIVO ADMIN */}
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <div className="bg-slate-900 p-2 rounded-xl">
                            <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400" aria-hidden="true" />
                        </div>
                        <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                            <ShieldCheck className="h-6 w-6 text-blue-700" aria-hidden="true" />
                        </div>
                    </div>

                    <CardTitle className="text-2xl font-bold text-slate-900">Solicitud de Administrador</CardTitle>
                    <CardDescription>Panel de Gestión y Control de Lumina</CardDescription>
                </CardHeader>

                <CardContent>
                    {/* AVISO IMPORTANTE */}
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg mb-6 flex items-start gap-2" role="alert">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span>
                            <strong>Nota:</strong> El registro como administrador requiere <u>aprobación manual</u>. No podrás acceder inmediatamente.
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Completo</Label>
                            <Input
                                id="nombre"
                                type="text"
                                placeholder="Tu nombre"
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
                            <Label htmlFor="email">Correo Corporativo</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@empresa.com"
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
                                    placeholder="Alta seguridad"
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
                                    Requiere mayúscula, minúsculas, números y símbolos.
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
                            aria-label={isLoading ? "Enviando solicitud..." : "Solicitar acceso de administrador"}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Solicitar Acceso Admin"}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center pb-6 border-t bg-slate-50/50 rounded-b-xl pt-4">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                        aria-label="Volver a la pantalla de inicio de sesión"
                    >
                        Volver al Inicio de Sesión
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}