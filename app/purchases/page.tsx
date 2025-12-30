"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ReceiptDialog } from "@/components/payment/receipt-dialog";
import { Loader2, FileText, ArrowLeft, Calendar, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

interface Transaction {
    transactionId: string;
    fechaPago: string;
    monto: number;
    nombreCursoOCombo: string;
}

export default function PurchasesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchHistory = async () => {
            // Verificación rápida de sesión
            if (!localStorage.getItem('jwtToken')) {
                toast.warning("Debes iniciar sesión para ver tus compras.");
                router.push('/login');
                return;
            }

            try {
                // Axios gestiona la URL y el Token automáticamente
                const response = await api.get('/pagos/mis-compras');

                // Axios devuelve los datos directamente en .data
                setTransactions(response.data);

            } catch (error: any) {
                console.error(error);
                if (error.response && error.response.status === 401) {
                    toast.error("Sesión expirada.");
                    router.push('/login');
                } else {
                    toast.error("No se pudo cargar el historial de compras.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [router]);

    if (isLoading) return <div className="flex justify-center items-center h-screen text-slate-500"><Loader2 className="animate-spin mr-2"/> Cargando historial...</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-5xl min-h-screen">

            {/* CABECERA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-xl">
                        <FileText className="h-8 w-8 text-slate-700" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Historial de Compras</h1>
                        <p className="text-slate-500 text-sm">Consulta y descarga tus comprobantes de pago.</p>
                    </div>
                </div>
                <Button variant="outline" asChild className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                    <Link href="/my-courses" aria-label="Volver al panel de Mis Cursos">
                        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Volver a Mis Cursos
                    </Link>
                </Button>
            </div>

            <Card className="shadow-lg border-slate-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-xl font-bold text-slate-800">Transacciones Realizadas</CardTitle>
                    <CardDescription>Lista detallada de tus adquisiciones en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {transactions.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
                                <Package className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No hay compras registradas</h3>
                            <p className="text-slate-500 mt-1 mb-4">Aún no has adquirido ningún curso o paquete.</p>
                            <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                                <Link href="/courses">Ir al Catálogo</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border-0 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-100/80">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-700 w-[180px]">
                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/> Fecha</span>
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-700">
                                            <span className="flex items-center gap-1"><Package className="h-3 w-3"/> Detalle</span>
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-700 w-[120px]">
                                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3"/> Monto</span>
                                        </TableHead>
                                        <TableHead className="text-right font-bold text-slate-700">Comprobante</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx) => (
                                        <TableRow key={tx.transactionId} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="font-medium text-slate-600">
                                                {tx.fechaPago}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-slate-800">{tx.nombreCursoOCombo}</span>
                                            </TableCell>
                                            <TableCell className="font-semibold text-emerald-600">
                                                ${tx.monto.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {/* El componente ReceiptDialog se encarga del botón de descarga */}
                                                <ReceiptDialog transactionId={tx.transactionId} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}