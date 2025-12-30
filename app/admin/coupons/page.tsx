"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    ArrowLeft,
    Ticket,
    Percent,
    CalendarDays,
    Loader2,
    Save
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/axios"; // <--- Importamos tu configuración de Axios

export default function CreateCouponPage() {
    const [codigo, setCodigo] = useState("");
    const [descuento, setDescuento] = useState(""); // String para validar regex
    const [fechaFin, setFechaFin] = useState<Date>();
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    // Verificación básica de sesión (aunque el middleware/layout debería encargarse)
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    // --- VALIDACIÓN NUMÉRICA (REGEX) ---
    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "" || /^\d*(\.\d{0,2})?$/.test(val)) {
            setDescuento(val);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // --- VALIDACIONES LOCALES ---
        if (!codigo.trim()) { toast.warning("El código es obligatorio."); return; }
        if (!fechaFin) { toast.warning("Selecciona una fecha de vencimiento."); return; }

        const descNumber = parseFloat(descuento);
        if (!descuento || isNaN(descNumber) || descNumber <= 0 || descNumber > 100) {
            toast.warning("El descuento debe ser entre 0% y 100%.");
            return;
        }

        setIsLoading(true);

        const fechaFormateada = format(fechaFin, "yyyy-MM-dd");

        const couponData = {
            codigo: codigo.trim().toUpperCase(),
            descuentoPorcentaje: descNumber,
            fechaFin: fechaFormateada
        };

        try {
            // --- PETICIÓN CON AXIOS (Limpia y directa) ---
            await api.post('/admin/cupones', couponData);

            toast.success(`Cupón ${couponData.codigo} creado!`, {
                description: `Descuento del ${couponData.descuentoPorcentaje}% válido hasta ${fechaFormateada}.`
            });

            // Reset del formulario
            setCodigo("");
            setDescuento("");
            setFechaFin(undefined);

            // Opcional: Redirigir a la lista de cupones
            // router.push('/admin/coupons');

        } catch (err: any) {
            console.error(err);
            // Manejo de errores específico de Axios
            if (err.response && err.response.data) {
                const msg = err.response.data.error || err.response.data.mensaje || "Error al crear el cupón.";
                toast.error(msg);
            } else {
                toast.error("Error de conexión con el servidor.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-xl min-h-screen flex flex-col justify-center">

            {/* BOTÓN VOLVER */}
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="pl-0 text-slate-500 hover:text-slate-900">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
                    </Link>
                </Button>
            </div>

            <Card className="border-t-4 border-t-emerald-500 shadow-xl border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                            <Ticket className="h-6 w-6 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Crear Cupón</CardTitle>
                    </div>
                    <CardDescription>
                        Genera códigos promocionales para incentivar ventas.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* CÓDIGO */}
                        <div className="space-y-2">
                            <Label htmlFor="codigo" className="font-semibold text-slate-700">Código Promocional</Label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="codigo"
                                    placeholder="Ej: VERANO2025"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    className="pl-10 border-slate-200 focus-visible:ring-emerald-500 uppercase font-mono"
                                />
                            </div>
                            <p className="text-xs text-slate-400">Se guardará automáticamente en mayúsculas.</p>
                        </div>

                        {/* DESCUENTO */}
                        <div className="space-y-2">
                            <Label htmlFor="descuento" className="font-semibold text-slate-700">Porcentaje de Descuento</Label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="descuento"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Ej: 20"
                                    value={descuento}
                                    onChange={handleDiscountChange}
                                    className="pl-10 border-slate-200 focus-visible:ring-emerald-500"
                                />
                            </div>
                            {parseFloat(descuento) > 100 && (
                                <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">
                                    El descuento no puede superar el 100%
                                </p>
                            )}
                        </div>

                        {/* FECHA VENCIMIENTO */}
                        <div className="space-y-2 flex flex-col">
                            <Label className="font-semibold text-slate-700">Fecha de Vencimiento</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal border-slate-200 hover:bg-slate-50",
                                            !fechaFin && "text-slate-500"
                                        )}
                                    >
                                        {fechaFin ? (
                                            <span className="text-slate-900 font-medium">{format(fechaFin, "PPP", { locale: es })}</span>
                                        ) : (
                                            <span>Selecciona una fecha límite</span>
                                        )}
                                        <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-slate-200 shadow-xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={fechaFin}
                                        onSelect={setFechaFin}
                                        disabled={(date) => date < new Date()} // Deshabilitar fechas pasadas
                                        initialFocus
                                        className="rounded-md border"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 shadow-lg transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4"/>}
                                {isLoading ? 'Generando...' : 'Guardar Cupón'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}