"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    UserPlus,
    ArrowLeft,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Shield,
    Briefcase,
    User,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

export default function CreateUserPage() {
    // --- ESTADOS DE DATOS ---
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("USER");

    // --- ESTADOS DE UI/VALIDACIÓN ---
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({
        nombre: "",
        email: "",
        password: "",
        general: ""
    });

    const router = useRouter();

    // --- FUNCIONES DE VALIDACIÓN ---
    const validateName = (name: string) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

    // --- MANEJO DEL ENVÍO ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // 1. Limpiar errores previos
        const newErrors = { nombre: "", email: "", password: "", general: "" };
        let isValid = true;

        if (!nombre.trim()) { newErrors.nombre = "El nombre es obligatorio."; isValid = false; }
        else if (!validateName(nombre)) { newErrors.nombre = "Solo letras y espacios."; isValid = false; }

        if (!validateEmail(email)) { newErrors.email = "Correo inválido."; isValid = false; }

        if (!validatePassword(password)) { newErrors.password = "Contraseña débil (8+ chars, mayús, minús, núm, símb)."; isValid = false; }

        setErrors(newErrors);

        if (!isValid) {
            setIsLoading(false);
            return;
        }

        try {
            // Petición POST con Axios (Token automático)
            await api.post('/root/create-user', {
                nombre: nombre.trim(),
                correo: email.trim(),
                contrasena: password,
                rol
            });

            toast.success(`Usuario ${nombre} creado con rol ${rol}!`);

            // Resetear formulario
            setNombre("");
            setEmail("");
            setPassword("");
            setRol("USER");

        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.data) {
                const errorData = error.response.data;

                // Manejo de error de validación específico (ej: correo duplicado)
                if (errorData.campo === 'email') {
                    setErrors(prev => ({ ...prev, email: errorData.mensaje }));
                    toast.error("El correo ya está registrado.");
                } else {
                    const msg = errorData.error || errorData.mensaje || "Error al crear usuario.";
                    toast.error(msg);
                    setErrors(prev => ({ ...prev, general: msg }));
                }
            } else {
                toast.error("Error de conexión con el servidor.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 flex flex-col items-center">

            <div className="w-full max-w-2xl">
                {/* CABECERA */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-900" onClick={() => router.push('/root')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Hub
                    </Button>
                </div>

                <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                    <CardHeader className="border-b border-slate-800 pb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                                <UserPlus className="h-6 w-6 text-blue-500" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-white">Alta Manual de Usuario</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400">
                            Crea cuentas con privilegios específicos. Estas cuentas se activan inmediatamente.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

                            {/* Nombre */}
                            <div className="space-y-2">
                                <Label htmlFor="nombre" className="text-slate-300">Nombre Completo</Label>
                                <div className="relative">
                                    <Input
                                        id="nombre"
                                        placeholder="Ej. Ana García"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className={`bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600 ${errors.nombre ? "border-red-500/50 focus-visible:ring-red-500" : ""}`}
                                    />
                                    {errors.nombre && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />}
                                </div>
                                {errors.nombre && <p className="text-red-400 text-xs">{errors.nombre}</p>}
                            </div>

                            {/* Correo */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Correo Electrónico</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="usuario@plataforma.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600 ${errors.email ? "border-red-500/50 focus-visible:ring-red-500" : ""}`}
                                    />
                                </div>
                                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Contraseña Temporal</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`bg-slate-950 border-slate-800 text-white pr-10 focus-visible:ring-blue-600 ${errors.password ? "border-red-500/50" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password ? (
                                    <p className="text-red-400 text-xs">{errors.password}</p>
                                ) : (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Shield className="h-3 w-3"/> Requisito: 8+ chars, mayús, minús, núm, símb.
                                    </p>
                                )}
                            </div>

                            {/* Selector de Rol */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Rol Asignado</Label>
                                <Select onValueChange={setRol} defaultValue="USER">
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white focus:ring-blue-600 h-11">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                                        <SelectItem value="USER">
                                            <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400"/> Estudiante (User)</div>
                                        </SelectItem>
                                        <SelectItem value="INSTRUCTOR">
                                            <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-amber-500"/> Instructor</div>
                                        </SelectItem>
                                        <SelectItem value="ADMIN">
                                            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-red-500"/> Administrador</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Botón de Acción */}
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 shadow-lg shadow-blue-900/20 mt-4"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5"/> : <CheckCircle2 className="mr-2 h-5 w-5"/>}
                                {isLoading ? "Registrando..." : "Confirmar Creación"}
                            </Button>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}