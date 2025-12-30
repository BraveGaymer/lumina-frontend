"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Download,
    Users,
    BookOpen,
    Trophy,
    ChevronDown,
    TableIcon,
    FileText,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// DTO del Backend
interface StudentActivityDto {
    nombreEstudiante: string;
    correoEstudiante: string;
    cantidadCursos: number;
    nombresCursos: string[];
}

export default function StudentReportPage() {
    const [data, setData] = useState<StudentActivityDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // 1. CARGA DE DATOS (Con Axios)
    useEffect(() => {
        const fetchReport = async () => {
            if (!localStorage.getItem('jwtToken')) { router.push('/login'); return; }

            try {
                // Axios gestiona la URL y el Token automáticamente
                const res = await api.get('/instructor/reportes/estudiantes-activos');
                setData(res.data);

            } catch (error: any) {
                console.error(error);
                if (error.response && error.response.status === 403) {
                    toast.error("No tienes permisos de instructor.");
                } else {
                    toast.error("No se pudo cargar el reporte.");
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
            // La promesa a ejecutar
            api.get(`/instructor/reportes/estudiantes-activos/${endpoint}`, {
                responseType: 'blob' // <--- CLAVE: Indicamos a Axios que esperamos un archivo binario
            }).then((res) => {
                // Crear URL del Blob
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_Estudiantes_${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(a);
                a.click();

                // Limpieza
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }),
            {
                loading: 'Generando archivo...',
                success: 'Reporte descargado correctamente',
                error: 'No se pudo descargar el reporte'
            }
        );
    };

    if (isLoading) return <div className="flex justify-center h-screen items-center text-slate-500"><Loader2 className="animate-spin mr-2"/> Analizando estudiantes...</div>;

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-6xl min-h-screen">

            {/* Cabecera */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-slate-100">
                        <Link href="/instructor" aria-label="Volver al panel">
                            <ArrowLeft className="h-5 w-5 text-slate-500 hover:text-slate-900" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Estudiantes Más Activos</h1>
                        <p className="text-slate-500 text-sm">Usuarios inscritos en múltiples cursos tuyos.</p>
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

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" /> Total Estudiantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{data.length}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="h-4 w-4" /> Super Fan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-800 truncate" title={data.length > 0 ? data[0].nombreEstudiante : ""}>
                            {data.length > 0 ? data[0].nombreEstudiante : "-"}
                        </div>
                        <p className="text-xs text-amber-700/70 font-medium">
                            {data.length > 0 ? `${data[0].cantidadCursos} cursos inscritos` : "Sin datos"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla Detallada */}
            <Card className="shadow-sm border-slate-200 overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[300px] font-bold text-slate-700">Estudiante</TableHead>
                                <TableHead className="text-center font-bold text-slate-700">Cursos Inscritos</TableHead>
                                <TableHead className="font-bold text-slate-700">Detalle de Cursos</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="font-semibold text-slate-900">{item.nombreEstudiante}</div>
                                        <div className="text-xs text-slate-500">{item.correoEstudiante}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">
                                            {item.cantidadCursos}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            {item.nombresCursos.map((curso, i) => (
                                                <span key={i} className="text-xs bg-white text-slate-600 px-2 py-1 rounded border border-slate-200 flex items-center shadow-sm">
                                                    <BookOpen className="h-3 w-3 mr-1.5 text-amber-500"/>
                                                    {curso}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-16 text-slate-400">
                                        <Users className="h-10 w-10 mx-auto mb-2 opacity-20"/>
                                        <p>No hay estudiantes registrados aún.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}