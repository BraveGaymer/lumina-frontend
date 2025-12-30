"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Download,
    DollarSign,
    Users,
    TrendingUp,
    FileText,
    Table as TableIcon,
    ChevronDown,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// Importamos la gráfica que acabamos de crear
import { SalesChart } from "@/components/reports/SalesChart";

// DTO del Backend
interface TopSellingCourseDto {
    cursoId: string;
    cursoTitulo: string;
    numeroDeVentas: number;
    ingresosGenerados: number;
}

export default function SalesReportPage() {
    const [data, setData] = useState<TopSellingCourseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // 1. CARGA DE DATOS (Con Axios)
    useEffect(() => {
        const fetchReport = async () => {
            if (!localStorage.getItem('jwtToken')) { router.push('/login'); return; }

            try {
                const res = await api.get('/instructor/reportes/mis-ventas');
                setData(res.data);
            } catch (error: any) {
                console.error(error);
                if (error.response && error.response.status === 403) {
                    toast.error("Acceso denegado.");
                } else {
                    toast.error("No se pudo cargar el reporte de ventas.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, [router]);

    // 2. DESCARGA DE CSV / PDF (Con Axios Blob)
    const handleDownload = async (format: 'csv' | 'pdf') => {
        const endpoint = format === 'csv' ? 'exportar-csv' : 'exportar-pdf';

        toast.promise(
            api.get(`/instructor/reportes/mis-ventas/${endpoint}`, {
                responseType: 'blob' // <--- CRUCIAL PARA DESCARGAS
            }).then((res) => {
                // Crear URL temporal para el archivo
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();

                // Limpieza de memoria
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }),
            {
                loading: 'Generando reporte financiero...',
                success: 'Reporte descargado exitosamente',
                error: 'Error al generar el archivo'
            }
        );
    };

    // Cálculos de Totales (KPIs)
    const totalIngresos = data.reduce((sum, item) => sum + item.ingresosGenerados, 0);
    const totalVentas = data.reduce((sum, item) => sum + item.numeroDeVentas, 0);

    // Preparar datos para la gráfica (Mapeo simple)
    const chartData = data.map(item => ({
        name: item.cursoTitulo.length > 15 ? item.cursoTitulo.substring(0, 15) + '...' : item.cursoTitulo,
        ventas: item.numeroDeVentas,
        ingresos: item.ingresosGenerados
    }));

    if (isLoading) return <div className="flex justify-center h-screen items-center text-slate-500"><Loader2 className="animate-spin mr-2"/> Calculando ingresos...</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-7xl min-h-screen">

            {/* Cabecera */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-slate-100">
                        <Link href="/instructor" aria-label="Volver al panel">
                            <ArrowLeft className="h-5 w-5 text-slate-500 hover:text-slate-900" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Reporte de Ventas</h1>
                        <p className="text-slate-500 text-sm">Resumen financiero de tus cursos.</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-sm">
                            <Download className="h-4 w-4" /> Exportar Reporte <ChevronDown className="h-4 w-4 opacity-50"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleDownload('csv')} className="cursor-pointer">
                            <TableIcon className="mr-2 h-4 w-4 text-emerald-600"/> Formato CSV (Excel)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload('pdf')} className="cursor-pointer">
                            <FileText className="mr-2 h-4 w-4 text-red-600"/> Formato PDF
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Tarjetas de Resumen (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Ingresos */}
                <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <DollarSign className="h-24 w-24 text-emerald-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ingresos Totales</CardTitle>
                        <div className="bg-emerald-100 p-1.5 rounded-full"><DollarSign className="h-4 w-4 text-emerald-600" /></div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-black text-slate-900">${totalIngresos.toFixed(2)}</div>
                        <p className="text-xs text-slate-500 font-medium mt-1">Acumulado histórico</p>
                    </CardContent>
                </Card>

                {/* Ventas */}
                <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Users className="h-24 w-24 text-blue-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-blue-600 uppercase tracking-wider">Ventas Totales</CardTitle>
                        <div className="bg-blue-100 p-1.5 rounded-full"><Users className="h-4 w-4 text-blue-600" /></div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl font-black text-slate-900">{totalVentas}</div>
                        <p className="text-xs text-slate-500 font-medium mt-1">Cursos vendidos</p>
                    </CardContent>
                </Card>

                {/* Curso Estrella */}
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <TrendingUp className="h-24 w-24 text-amber-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-amber-600 uppercase tracking-wider">Curso Estrella</CardTitle>
                        <div className="bg-amber-100 p-1.5 rounded-full"><TrendingUp className="h-4 w-4 text-amber-600" /></div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-lg font-bold text-slate-900 truncate" title={data.length > 0 ? data[0].cursoTitulo : ""}>
                            {data.length > 0 ? data[0].cursoTitulo : "N/A"}
                        </div>
                        <p className="text-xs text-amber-800/70 font-medium mt-1">Mayor volumen de ventas</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Gráfica (2/3) */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-base font-bold text-slate-800">Rendimiento por Curso</CardTitle>
                        <CardDescription>Comparativa visual de ingresos generados.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {data.length > 0 ? (
                            <div className="h-[350px] w-full">
                                {/* Componente de Gráfica Recharts */}
                                <SalesChart data={chartData} />
                            </div>
                        ) : (
                            <div className="h-[350px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                                <TrendingUp className="h-12 w-12 mb-2 opacity-20"/>
                                <p>Aún no hay suficientes datos para graficar.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tabla Detallada (1/3) */}
                <Card className="lg:col-span-1 shadow-sm border-slate-200 flex flex-col h-full">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                        <CardTitle className="text-base font-bold text-slate-800">Detalle de Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden flex-1">
                        <div className="overflow-y-auto max-h-[400px] lg:max-h-full">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="w-[60%] font-bold text-xs uppercase tracking-wider text-slate-500">Curso</TableHead>
                                        <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-500">Ingresos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((item) => (
                                        <TableRow key={item.cursoId} className="hover:bg-slate-50/50">
                                            <TableCell className="py-3">
                                                <div className="font-medium text-sm text-slate-800 line-clamp-2 leading-tight mb-1" title={item.cursoTitulo}>
                                                    {item.cursoTitulo}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                    {item.numeroDeVentas} ventas
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 text-sm align-top py-3">
                                                ${item.ingresosGenerados.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-xs text-slate-400">
                                                Sin ventas registradas
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}