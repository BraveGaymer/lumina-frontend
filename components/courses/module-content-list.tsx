"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    FileText,
    ClipboardList,
    GripVertical,
    Loader2,
    Edit2,
    Trash2,
    File,
    MonitorPlay
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Your new connection

// --- TYPES ---
interface ContentItem {
    id: string;
    titulo: string;
    tipo: "MATERIAL" | "EVALUACION";
    subtipo?: string;
    orderIndex: number;
}

// --- SUB-COMPONENT: DRAGGABLE ROW ---
interface SortableItemProps {
    item: ContentItem;
    onEdit: (id: string, tipo: string) => void;
    onDelete: (id: string, tipo: string) => void;
}

function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 50 : "auto",
    };

    // Icon based on type
    const getIcon = () => {
        const tipo = item.tipo?.toUpperCase();
        const subtipo = item.subtipo?.toUpperCase() || "";

        if (tipo === 'EVALUACION') return <ClipboardList className="text-emerald-600 h-5 w-5" />;
        if (subtipo.includes('VIDEO')) return <MonitorPlay className="text-amber-500 h-5 w-5" />;
        if (subtipo.includes('PDF')) return <FileText className="text-red-500 h-5 w-5" />;
        return <File className="text-slate-400 h-5 w-5" />;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg mb-2 shadow-sm group hover:border-slate-300 hover:shadow-md transition-all relative"
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-1 hover:bg-slate-50 rounded"
                title="Arrastrar para reordenar"
            >
                <GripVertical size={20} />
            </div>

            {/* Icon */}
            <div className="p-2 bg-slate-50 rounded-md border border-slate-100">
                {getIcon()}
            </div>

            {/* Titles */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{item.titulo}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    {item.subtipo || (item.tipo === 'EVALUACION' ? 'EXAMEN' : 'LECTURA')}
                </p>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 backdrop-blur-sm pl-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                    title="Editar contenido"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item.id, item.tipo);
                    }}
                >
                    <Edit2 size={16} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Eliminar contenido"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id, item.tipo);
                    }}
                >
                    <Trash2 size={16} />
                </Button>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function ModuleContentList({ moduleId }: { moduleId: string }) {
    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const params = useParams();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // 1. LOAD CONTENT
    const fetchContent = async () => {
        if (!moduleId) return;
        // Basic check
        if (!localStorage.getItem('jwtToken')) return;

        try {
            // Clean GET request
            const res = await api.get(`/modulos/${moduleId}/contenido`);
            setItems(res.data);
        } catch (err) {
            console.error("Error cargando contenido:", err);
            // Optional: toast.error("Error al cargar contenido");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchContent(); }, [moduleId]);

    // 2. DRAG & DROP
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                saveOrder(newOrder);
                return newOrder;
            });
        }
    };

    // 3. SAVE ORDER
    const saveOrder = async (orderedItems: ContentItem[]) => {
        const payload = orderedItems.map(item => ({
            id: item.id,
            type: item.tipo
        }));

        try {
            // Clean PUT request
            await api.put(`/modulos/${moduleId}/contenido/ordenar`, payload);
        } catch (err) {
            console.error(err);
            toast.error("Error al guardar el orden.");
        }
    };

    // 4. DELETE ITEM
    const handleDelete = async (itemId: string, tipo: string) => {
        if (!confirm("⚠️ ¿Eliminar este contenido? No se podrá recuperar.")) return;

        const resource = tipo === 'MATERIAL' ? 'materiales' : 'evaluaciones';

        try {
            // Clean DELETE request
            await api.delete(`/modulos/${moduleId}/${resource}/${itemId}`);

            setItems(prev => prev.filter(i => i.id !== itemId));
            toast.success("Contenido eliminado.");
        } catch (err) {
            console.error(err);
            toast.error("No se pudo eliminar el elemento.");
        }
    };

    // 5. EDIT ITEM
    const handleEdit = (itemId: string, tipo: string) => {
        const courseId = params.courseId;

        if (tipo === 'MATERIAL') {
            router.push(`/instructor/courses/${courseId}/edit-material/${itemId}?moduleId=${moduleId}`);
        } else if (tipo === 'EVALUACION') {
            router.push(`/instructor/courses/${courseId}/edit-evaluation/${itemId}?moduleId=${moduleId}`);
        }
    };

    if (loading) return <div className="py-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300"/></div>;

    return (
        <div className="mt-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {items.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center">
                    <File className="h-8 w-8 text-slate-300 mb-2 opacity-50" />
                    <p className="text-sm text-slate-500 font-medium">Módulo vacío</p>
                    <p className="text-xs text-slate-400">Agrega material o evaluaciones arriba.</p>
                </div>
            )}
        </div>
    );
}