"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Edit2,
    Trash2,
    Save,
    X,
    Plus,
    Loader2,
    FilePlus,
    ClipboardCheck,
    GripVertical,
    FolderPlus
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

import ModuleContentList from "./module-content-list";

interface Module {
    id: string;
    titulo: string;
    orderIndex: number;
}

// --- SUB-COMPONENTE: MÓDULO ARRASTRABLE ---
function SortableModuleItem({ module, children }: { module: Module, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.6 : 1,
        position: 'relative' as const
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-4 group relative pl-8">
            <div
                {...attributes}
                {...listeners}
                className="absolute left-0 top-3.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded p-1 transition-colors"
                title="Arrastrar para reordenar módulo"
            >
                <GripVertical size={20} />
            </div>
            {children}
        </div>
    );
}

export default function CourseModules({ courseId }: { courseId: string }) {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Estados para Crear
    const [newTitle, setNewTitle] = useState("");

    // Estados para Editar
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    // Sensores DND
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- 1. CARGAR MÓDULOS (Con Axios) ---
    const fetchModules = async () => {
        if (!localStorage.getItem('jwtToken')) return;
        try {
            setLoading(true);
            // Petición GET limpia
            const res = await api.get(`/cursos/${courseId}/modulos`);

            // Ordenar por índice antes de mostrar
            const sortedData = res.data.sort((a: Module, b: Module) => a.orderIndex - b.orderIndex);
            setModules(sortedData);

        } catch (err) {
            console.error(err);
            toast.error("Error al cargar módulos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (courseId) fetchModules(); }, [courseId]);

    // --- 2. CREAR MÓDULO ---
    const handleCreate = async () => {
        if (!newTitle.trim()) {
            toast.warning("El nombre del módulo no puede estar vacío.");
            return;
        }

        setIsCreating(true);

        try {
            // Petición POST limpia
            await api.post(`/cursos/${courseId}/modulos`, { titulo: newTitle });

            toast.success("Módulo creado exitosamente");
            setNewTitle("");
            fetchModules();

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                toast.error(err.response.data.error || "No se pudo crear el módulo.");
            } else {
                toast.error("Error de conexión.");
            }
        } finally {
            setIsCreating(false);
        }
    };

    // --- 3. ELIMINAR MÓDULO ---
    const handleDelete = async (moduleId: string) => {
        if (!confirm("⚠️ ¿Estás seguro de eliminar este módulo?\n\nSe borrarán todas las lecciones y exámenes que contenga.")) return;

        try {
            // Petición DELETE limpia
            await api.delete(`/cursos/${courseId}/modulos/${moduleId}`);

            setModules(modules.filter(m => m.id !== moduleId));
            toast.success("Módulo eliminado.");

        } catch (err) {
            console.error(err);
            toast.error("Error al eliminar el módulo.");
        }
    };

    // --- 4. GUARDAR EDICIÓN (Renombrar) ---
    const saveEdit = async () => {
        if (!editTitle.trim()) return;

        try {
            // Petición PUT limpia
            await api.put(`/cursos/${courseId}/modulos/${editingId}`, { titulo: editTitle });

            setEditingId(null);
            fetchModules(); // Recargamos para asegurar sincronía
            toast.success("Nombre actualizado");

        } catch (err) {
            console.error(err);
            toast.error("Error al actualizar nombre.");
        }
    };

    // --- 5. REORDENAR (DRAG END) ---
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setModules((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Guardamos en el backend después de actualizar el estado visual
                saveModuleOrder(newOrder);
                return newOrder;
            });
        }
    };

    const saveModuleOrder = async (orderedModules: Module[]) => {
        const ids = orderedModules.map(m => m.id);
        try {
            // Petición PUT para ordenar (el endpoint espera una lista de IDs)
            await api.put(`/cursos/${courseId}/modulos/ordenar`, ids);
            // No mostramos toast para no saturar
        } catch (err) {
            console.error(err);
            toast.error("Error al guardar el orden.");
        }
    };

    return (
        <div className="space-y-6">

            {/* INPUT NUEVO MÓDULO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                    <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        placeholder="Nombre del nuevo módulo (Ej: Introducción a Java)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        className="pl-9 bg-white border-slate-200 focus-visible:ring-amber-500"
                        disabled={isCreating}
                    />
                </div>
                <Button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || isCreating}
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                    {isCreating ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2" />}
                    Crear Módulo
                </Button>
            </div>

            {loading && <div className="text-center py-8 text-slate-400"><Loader2 className="animate-spin h-8 w-8 mx-auto mb-2"/> Cargando estructura...</div>}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={modules} strategy={verticalListSortingStrategy}>
                    <Accordion type="single" collapsible className="w-full space-y-3">
                        {modules.map((modulo) => (
                            <SortableModuleItem key={modulo.id} module={modulo}>
                                <AccordionItem value={modulo.id} className="bg-white border border-slate-200 rounded-lg shadow-sm px-1 overflow-hidden">

                                    {/* --- CABECERA DEL MÓDULO --- */}
                                    <div className="flex items-center justify-between pr-2">

                                        {/* ZONA IZQUIERDA: Título o Input de Edición */}
                                        <div className="flex-1 flex items-center overflow-hidden">
                                            {editingId === modulo.id ? (
                                                <div className="flex flex-1 gap-2 items-center p-3 z-20 relative animate-in fade-in">
                                                    <Input
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if(e.key === 'Enter') saveEdit();
                                                            if(e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        className="h-9 border-amber-400 focus-visible:ring-amber-500"
                                                    />
                                                    <Button size="sm" onClick={saveEdit} className="bg-emerald-600 hover:bg-emerald-700 h-9 w-9 p-0 text-white shadow-sm">
                                                        <Save className="h-4 w-4"/>
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-9 w-9 p-0 hover:bg-slate-100">
                                                        <X className="h-4 w-4 text-slate-500"/>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <AccordionTrigger className="hover:no-underline px-4 py-4 text-base font-bold text-slate-800 text-left hover:text-amber-600 transition-colors w-full">
                                                    {modulo.titulo}
                                                </AccordionTrigger>
                                            )}
                                        </div>

                                        {/* ZONA DERECHA: Botones (Solo visibles si no se edita) */}
                                        {editingId !== modulo.id && (
                                            <div className="flex items-center gap-1 z-20 relative ml-2">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setEditingId(modulo.id);
                                                        setEditTitle(modulo.titulo);
                                                    }}
                                                    aria-label="Editar nombre del módulo"
                                                >
                                                    <Edit2 className="h-4 w-4"/>
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        handleDelete(modulo.id);
                                                    }}
                                                    aria-label="Eliminar módulo"
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* CONTENIDO DESPLEGABLE */}
                                    <AccordionContent className="px-4 pb-6 pt-0 border-t border-slate-100 bg-slate-50/30">
                                        <div className="flex gap-3 my-4 justify-end">
                                            <Button variant="outline" size="sm" asChild className="text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-medium h-9">
                                                <Link href={`/instructor/courses/${courseId}/add-material?moduleId=${modulo.id}`}>
                                                    <FilePlus className="w-4 h-4 mr-2 text-amber-500" /> Agregar Material
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild className="text-slate-700 bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm font-medium h-9">
                                                <Link href={`/instructor/courses/${courseId}/add-evaluation?moduleId=${modulo.id}`}>
                                                    <ClipboardCheck className="w-4 h-4 mr-2 text-emerald-500" /> Agregar Examen
                                                </Link>
                                            </Button>
                                        </div>

                                        {/* Lista interna de lecciones */}
                                        <div className="bg-white rounded-lg border border-slate-200 p-1">
                                            <ModuleContentList moduleId={modulo.id} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </SortableModuleItem>
                        ))}
                    </Accordion>
                </SortableContext>
            </DndContext>

            {!loading && modules.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 flex flex-col items-center">
                    <FolderPlus className="h-10 w-10 mb-2 opacity-50" />
                    <p className="font-medium">No has creado módulos todavía.</p>
                    <p className="text-xs mt-1">Empieza creando el primero arriba.</p>
                </div>
            )}
        </div>
    );
}