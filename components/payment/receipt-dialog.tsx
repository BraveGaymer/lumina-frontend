"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Loader2, Printer, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

interface ReceiptDialogProps {
    transactionId: string;
}

interface ReceiptData {
    transactionId: string;
    fechaPago: string;
    cursoTitulo: string;
    nombreUsuario: string;
    metodoPago: string;
    montoPagado: number;
}

export function ReceiptDialog({ transactionId }: ReceiptDialogProps) {
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const loadReceipt = async () => {
        if (receipt) return; // Si ya lo cargamos una vez, usamos caché local

        setIsLoading(true);

        try {
            // Petición GET limpia con Axios
            const res = await api.get(`/pagos/comprobante/${transactionId}`);
            setReceipt(res.data);

        } catch (e) {
            console.error(e);
            toast.error("No se pudo cargar el comprobante.");
            setIsOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) loadReceipt();
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-2 h-8"
                    aria-label="Ver detalle del recibo"
                >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Ver Recibo</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-white border-slate-200 shadow-2xl">
                <DialogHeader className="border-b border-slate-100 pb-4 mb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-900 p-1.5 rounded-lg">
                                <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400" />
                            </div>
                            <span className="font-bold text-slate-900 tracking-tight">Lumina Learning</span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">Recibo</div>
                    </div>
                    {/* Título oculto visualmente pero necesario para accesibilidad */}
                    <DialogTitle className="sr-only">Comprobante de Pago</DialogTitle>
                    <DialogDescription className="sr-only">Detalles de la transacción {transactionId}</DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                        <Loader2 className="animate-spin h-8 w-8 text-slate-900" />
                        <span className="text-sm">Recuperando datos...</span>
                    </div>
                ) : receipt ? (
                    <div className="space-y-6">

                        {/* ESTADO DE PAGO */}
                        <div className="flex flex-col items-center justify-center py-2">
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-emerald-100 mb-2">
                                <CheckCircle2 className="h-3 w-3" /> Pagado
                            </div>
                            <div className="text-3xl font-black text-slate-900">
                                ${receipt.montoPagado.toFixed(2)}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Total abonado</p>
                        </div>

                        {/* DETALLES TIPO TICKET */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-sm space-y-3 relative overflow-hidden">
                            {/* Decoración visual */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50"></div>

                            <div className="flex justify-between items-center border-b border-slate-200 border-dashed pb-3">
                                <span className="text-slate-500">Fecha</span>
                                <span className="font-medium text-slate-800">{new Date(receipt.fechaPago).toLocaleDateString()}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-slate-200 border-dashed pb-3">
                                <span className="text-slate-500">Transacción</span>
                                <span className="font-mono text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {receipt.transactionId.substring(0, 12)}...
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-slate-200 border-dashed pb-3">
                                <span className="text-slate-500">Método</span>
                                <span className="font-medium text-slate-800 capitalize">{receipt.metodoPago.toLowerCase()}</span>
                            </div>

                            <div className="pt-1">
                                <span className="text-slate-500 text-xs block mb-1">Concepto</span>
                                <p className="font-bold text-slate-900 leading-tight">
                                    {receipt.cursoTitulo}
                                </p>
                            </div>
                        </div>

                        {/* INFO USUARIO */}
                        <div className="text-center text-xs text-slate-400">
                            Recibo emitido a nombre de <span className="font-medium text-slate-600">{receipt.nombreUsuario}</span>
                        </div>

                        {/* BOTÓN IMPRIMIR */}
                        <div className="pt-2">
                            <Button
                                onClick={() => window.print()}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-medium shadow-lg transition-transform active:scale-[0.98]"
                            >
                                <Printer className="h-4 w-4"/> Imprimir Comprobante
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}