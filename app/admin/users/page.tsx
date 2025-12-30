"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Search,
    Shield,
    ShieldAlert,
    User as UserIcon,
    Ban,
    CheckCircle2,
    Loader2,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Importamos tu configuración de Axios

// Definición del Usuario
interface User {
    id: string;
    nombre: string;
    correo: string;
    fechaRegistro: string;
    estado: boolean;
    role: 'ROLE_USER' | 'ROLE_INSTRUCTOR' | 'ROLE_ADMIN';
}

interface PageResponse {
    content: User[];
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
    number: number;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);

    // Estados para Paginación y Búsqueda
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Lógica de "Debounce"
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    // --- CARGAR USUARIOS (Con Axios) ---
    const fetchUsers = async () => {
        setIsLoading(true);

        // Verificación rápida de sesión
        const token = localStorage.getItem('jwtToken');
        if (!token) { router.push('/login'); return; }

        try {
            // Axios maneja los parámetros de URL automáticamente con 'params'
            const response = await api.get('/admin/users', {
                params: {
                    page: page,
                    size: 10,
                    search: debouncedSearch || undefined // Envía solo si hay texto
                }
            });

            const data: PageResponse = response.data;

            setUsers(data.content);
            setTotalPages(data.totalPages);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 403) {
                toast.error("Acceso denegado. Se requieren permisos de administrador.");
            } else {
                toast.error("Error al cargar la lista de usuarios.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);


    // --- ACCIONES (Cambiar Rol) ---
    const toggleRole = async (user: User) => {
        const newRole = user.role === 'ROLE_USER' ? 'ROLE_INSTRUCTOR' : 'ROLE_USER';

        if (!confirm(`¿Estás seguro de cambiar el rol de ${user.nombre} a ${newRole}?`)) return;

        try {
            // Axios PUT request
            await api.put(`/admin/users/${user.id}`, {
                role: newRole,
                estado: user.estado
            });

            toast.success(`Rol actualizado a ${newRole}`);
            fetchUsers(); // Recargar lista

        } catch (e) {
            toast.error("No se pudo actualizar el rol.");
        }
    };

    // --- ACCIONES (Cambiar Estado) ---
    const toggleStatus = async (user: User) => {
        const newStatus = !user.estado;

        if (!confirm(`¿${newStatus ? "Activar" : "Bloquear"} el acceso a ${user.nombre}?`)) return;

        try {
            // Axios PUT request
            await api.put(`/admin/users/${user.id}`, {
                role: user.role,
                estado: newStatus
            });

            toast.success(`Usuario ${newStatus ? "activado" : "bloqueado"} correctamente.`);
            fetchUsers(); // Recargar lista

        } catch (e) {
            toast.error("No se pudo cambiar el estado.");
        }
    };

    // Helper para badges de rol
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ROLE_ADMIN':
                return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200"><ShieldAlert className="w-3 h-3 mr-1"/> Admin</Badge>;
            case 'ROLE_INSTRUCTOR':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"><Briefcase className="w-3 h-3 mr-1"/> Instructor</Badge>;
            default:
                return <Badge variant="outline" className="text-slate-600"><UserIcon className="w-3 h-3 mr-1"/> User</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* CABECERA */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
                    <p className="text-slate-500">Administra roles y permisos de acceso.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-800">Directorio</CardTitle>

                    {/* BARRA DE BÚSQUEDA */}
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por correo o nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 border-slate-200 focus-visible:ring-amber-500"
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="rounded-md border border-slate-100">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[300px]">Usuario</TableHead>
                                    <TableHead>Rol Actual</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                                            <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2"/> Cargando usuarios...
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                                            No se encontraron usuarios con ese criterio.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                <div className="font-medium text-slate-900">{user.nombre}</div>
                                                <div className="text-xs text-slate-500">{user.correo}</div>
                                            </TableCell>
                                            <TableCell>
                                                {getRoleBadge(user.role)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.estado
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                        : "bg-red-50 text-red-700 border border-red-100"
                                                }`}>
                                                    {user.estado ? <CheckCircle2 className="w-3 h-3"/> : <Ban className="w-3 h-3"/>}
                                                    {user.estado ? "Activo" : "Bloqueado"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {user.role !== 'ROLE_ADMIN' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => toggleRole(user)}
                                                            className="h-8 text-xs border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                                                            title="Cambiar Rol"
                                                        >
                                                            {user.role === 'ROLE_USER' ? <Shield className="w-3 h-3 mr-1"/> : <UserIcon className="w-3 h-3 mr-1"/>}
                                                            {user.role === 'ROLE_USER' ? 'Hacer Instructor' : 'Hacer Usuario'}
                                                        </Button>

                                                        <Button
                                                            variant={user.estado ? "ghost" : "outline"}
                                                            size="sm"
                                                            onClick={() => toggleStatus(user)}
                                                            className={`h-8 w-8 p-0 ${
                                                                user.estado
                                                                    ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                    : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                            }`}
                                                            title={user.estado ? "Bloquear Usuario" : "Activar Usuario"}
                                                        >
                                                            {user.estado ? <Ban className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* PAGINACIÓN */}
                    <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50/30">
                        <div className="text-xs text-slate-500 font-medium">
                            Página {page + 1} de {totalPages || 1}
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 0 || isLoading}
                                onClick={() => setPage(page - 1)}
                                className="h-8 text-xs"
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages - 1 || isLoading}
                                onClick={() => setPage(page + 1)}
                                className="h-8 text-xs"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}