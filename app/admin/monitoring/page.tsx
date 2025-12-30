"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Activity,
    CreditCard,
    Shield,
    SearchX,
    Loader2,
    Clock,
    User
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Importamos tu configuración

// --- DEFINICIÓN DE TIPOS ---
interface Transaction {
    transactionId: string;
    fechaPago: string;
    monto: number;
    metodoPago: string;
    correoUsuario: string;
    nombreCursoOCombo: string;
}

interface ActivityLog {
    id: string;
    timestamp: string;
    userEmail: string;
    actionType: string;
    details: string;
}

export default function MonitoringPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                // toast.error("Sesión expirada"); // Opcional para no saturar
                router.push('/login');
                return;
            }

            try {
                // Configuración de cabeceras para asegurar el token correcto
                const config = {
                    headers: { 'Authorization': `Bearer ${token}` }
                };

                // Carga paralela con Axios
                const [transRes, actRes] = await Promise.all([
                    api.get('/admin/monitoring/transactions', config),
                    api.get('/admin/monitoring/activities?page=0&size=50', config)
                ]);

                // Axios devuelve los datos directamente en .data
                setTransactions(transRes.data);
                setActivities(actRes.data.content); // Asumiendo que viene paginado en .content

            } catch (err: any) {
                console.error(err);
                if (err.response && err.response.status === 403) {
                    toast.error("Acceso denegado: No tienes permisos de administrador.");
                } else {
                    toast.error("Error al cargar los datos de monitoreo.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (isLoading) return <div className="flex justify-center h-screen items-center text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando sistema...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* CABECERA */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="h-8 w-8 text-orange-500" />
                        Monitoreo del Sistema
                    </h1>
                    <p className="text-slate-500">Auditoría de transacciones y registros de seguridad.</p>
                </div>
            </div>

            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="transactions" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg py-2">
                        <CreditCard className="w-4 h-4 mr-2 text-emerald-600"/> Transacciones
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg py-2">
                        <Shield className="w-4 h-4 mr-2 text-blue-600"/> Logs de Actividad
                    </TabsTrigger>
                </TabsList>

                {/* --- PESTAÑA 1: TRANSACCIONES --- */}
                <TabsContent value="transactions">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-slate-800 text-lg">Historial de Pagos</CardTitle>
                            <CardDescription>Últimas transacciones procesadas por la plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[150px]">Fecha</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? (
                                        transactions.map((tx) => (
                                            <TableRow key={tx.transactionId} className="hover:bg-slate-50/50">
                                                <TableCell className="text-slate-500 text-xs font-mono">
                                                    {tx.fechaPago}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-700">
                                                    {tx.correoUsuario}
                                                </TableCell>
                                                <TableCell className="text-slate-600">
                                                    {tx.nombreCursoOCombo}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-slate-500 border-slate-300 font-normal uppercase text-[10px]">
                                                        {tx.metodoPago}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600">
                                                    ${tx.monto.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <SearchX className="h-10 w-10 mb-2 opacity-20"/>
                                                    <p>No hay transacciones registradas.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PESTAÑA 2: ACTIVIDAD --- */}
                <TabsContent value="activity">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-slate-800 text-lg">Registro de Auditoría</CardTitle>
                            <CardDescription>Acciones críticas realizadas por usuarios y administradores.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[180px]">Hora</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Detalles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.length > 0 ? (
                                        activities.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-slate-50/50">
                                                <TableCell className="text-slate-500 text-xs font-mono flex items-center gap-2">
                                                    <Clock className="h-3 w-3 opacity-50"/>
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none font-medium">
                                                        {log.actionType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-600 flex items-center gap-2">
                                                    <User className="h-3 w-3 opacity-50"/>
                                                    {log.userEmail}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500 italic">
                                                    {log.details}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <Shield className="h-10 w-10 mb-2 opacity-20"/>
                                                    <p>El log de actividad está limpio.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}