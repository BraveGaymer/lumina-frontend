"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle2,
    ArrowLeft,
    RefreshCcw,
    ShieldAlert,
    UserCheck,
    Clock,
    Loader2,
    Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

interface PendingAdmin {
    id: string;
    nombreUsuario: string;
    correo: string;
    fechaRegistro: string;
}

export default function PendingRequestsPage() {
    const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const router = useRouter();

    const fetchPending = async () => {
        setIsLoading(true);
        // Verificación rápida de sesión
        if (!localStorage.getItem('jwtToken')) { router.push('/login'); return; }

        try {
            // Axios con GET
            const response = await api.get('/root/pending-admins');
            setPendingAdmins(response.data);

        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.status === 403) {
                toast.error("Acceso denegado. Solo Root.");
                router.push('/');
            } else {
                toast.error("Error al cargar solicitudes.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (id: string) => {
        setIsProcessing(id);

        try {
            // Axios con POST
            await api.post(`/root/approve/${id}`);

            toast.success("Usuario aprobado como Administrador");
            // Actualizar lista localmente para que sea instantáneo
            setPendingAdmins(prev => prev.filter(user => user.id !== id));

        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.data) {
                toast.error(error.response.data.error || "Error al procesar la solicitud.");
            } else {
                toast.error("Error de conexión.");
            }
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-white hover:bg-slate-900">
                            <Link href="/root">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <ShieldAlert className="h-8 w-8 text-red-500" />
                                Solicitudes de Acceso
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Usuarios esperando confirmación para privilegios de <span className="text-red-400 font-mono">ROLE_ADMIN</span>.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchPending}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                        disabled={isLoading}
                    >
                        <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar Lista
                    </Button>
                </div>

                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/50">
                        <CardTitle className="text-white flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-emerald-500"/> Cola de Aprobación
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Revisa cuidadosamente antes de otorgar acceso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                                <Loader2 className="h-8 w-8 animate-spin mb-2 text-emerald-500"/>
                                <p>Verificando solicitudes...</p>
                            </div>
                        ) : pendingAdmins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                                <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
                                </div>
                                <p className="text-lg font-medium text-slate-300">Todo al día</p>
                                <p className="text-sm">No hay solicitudes pendientes en este momento.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-950">
                                    <TableRow className="border-slate-800 hover:bg-slate-950">
                                        <TableHead className="text-slate-400 w-[250px]">Usuario</TableHead>
                                        <TableHead className="text-slate-400">Contacto</TableHead>
                                        <TableHead className="text-slate-400">Solicitado</TableHead>
                                        <TableHead className="text-right text-slate-400">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingAdmins.map((admin) => (
                                        <TableRow key={admin.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <TableCell className="font-medium text-white py-4">
                                                {admin.nombreUsuario}
                                            </TableCell>
                                            <TableCell className="text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 opacity-50"/>
                                                    {admin.correo}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-slate-400 border-slate-700 bg-slate-900 gap-1 font-mono text-xs">
                                                    <Clock className="h-3 w-3"/>
                                                    {new Date(admin.fechaRegistro).toLocaleDateString()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    onClick={() => handleApprove(admin.id)}
                                                    disabled={isProcessing === admin.id}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                                                    size="sm"
                                                >
                                                    {isProcessing === admin.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                                    ) : (
                                                        <>Aprobar Acceso</>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}