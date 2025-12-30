"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { X, Plus, AlertCircle, Loader2, Image as ImageIcon, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu cliente Axios configurado

interface Category {
    id: number;
    nombre: string;
}

export default function CreateCoursePage() {

    // --- ESTADOS ---
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precio, setPrecio] = useState("");

    // Imagen
    const [portadaUrl, setPortadaUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    // Categorías
    const [catInput, setCatInput] = useState("");
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [existingCats, setExistingCats] = useState<Category[]>([]);
    const [suggestions, setSuggestions] = useState<Category[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // 1. CARGA INICIAL (Verificación de permisos + Categorías)
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (!token) { router.push('/login'); return; }

        try {
            // Decodificación segura (si falla, el catch lo atrapa)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userRole = payload.role || (payload.roles && payload.roles[0]) || "";
            const allowedRoles = ["ROLE_INSTRUCTOR", "ROLE_ADMIN", "ROLE_SUPER_ROOT"];

            const hasPermission = allowedRoles.includes(userRole) ||
                (Array.isArray(userRole) && userRole.some(r => allowedRoles.includes(r)));

            if (!hasPermission) {
                toast.error("No tienes permisos de instructor para crear cursos.");
                router.push('/courses');
                return;
            }

            // Cargar categorías existentes con Axios
            api.get('/categorias')
                .then(res => setExistingCats(res.data))
                .catch(() => toast.error("No se pudieron cargar las categorías del servidor."));

        } catch (e) {
            router.push('/login');
        }
    }, [router]);

    // 2. PRECIO
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "" || /^\d+(\.\d{0,2})?$/.test(val)) {
            setPrecio(val);
        }
    };

    // 3. SUBIDA DE IMAGEN (Con Axios)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Axios detecta automáticamente que es Multipart/Form-Data
            const res = await api.post("/media/upload", formData, {
                headers: {
                    // Importante: No establecer Content-Type manualmente aquí para que el navegador ponga el boundary correcto
                    // Axios suele manejarlo bien, pero si falla, se puede forzar 'Content-Type': 'multipart/form-data'
                }
            });

            setPortadaUrl(res.data.url);
            toast.success("Imagen subida correctamente");

        } catch (error) {
            console.error(error);
            toast.error("Error al subir la imagen. Intenta con un archivo más pequeño.");
        } finally {
            setUploading(false);
        }
    };

    // 4. CATEGORÍAS (Lógica local - Sin cambios mayores, solo limpieza)
    const normalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    const handleCatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCatInput(val);
        setShowDropdown(true);
        if (val.trim().length > 0) {
            const filtered = existingCats.filter(c =>
                c.nombre.toLowerCase().includes(val.toLowerCase()) && !selectedCats.includes(c.nombre)
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]); setShowDropdown(false);
        }
    };

    const addCategory = (name: string) => {
        const normalizedName = normalize(name.trim());
        if (!normalizedName) return;
        if (selectedCats.includes(normalizedName)) {
            setCatInput(""); setShowDropdown(false); return;
        }
        setSelectedCats([...selectedCats, normalizedName]);
        setCatInput(""); setSuggestions([]); setShowDropdown(false);
    };

    const removeCategory = (name: string) => setSelectedCats(selectedCats.filter(c => c !== name));

    const handleCatKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); if (catInput.trim()) addCategory(catInput); }
    };

    // --- VALIDACIÓN ---
    const isFormValid = () => {
        return (
            titulo.trim().length > 5 &&
            descripcion.trim().length > 19 &&
            parseFloat(precio) > 0 &&
            selectedCats.length > 0
        );
    };

    // 5. ENVÍO (Con Axios)
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Validaciones finales
        if (!titulo.trim()) { toast.warning("El título es obligatorio."); return; }
        if (descripcion.trim().length < 20) { toast.warning("La descripción es muy corta."); return; }
        if (!precio || parseFloat(precio) <= 0) { toast.warning("El precio debe ser mayor a 0."); return; }
        if (selectedCats.length === 0) { toast.warning("Agrega al menos una categoría."); return; }

        setIsSubmitting(true);

        const courseData = {
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            precio: parseFloat(precio),
            categorias: selectedCats,
            portadaUrl: portadaUrl
        };

        try {
            // Petición POST limpia
            const response = await api.post('/cursos/crear', courseData);

            toast.success(`¡Curso "${response.data.titulo}" creado!`, {
                description: "Ahora serás redirigido para gestionar el contenido."
            });

            // Redirigir al panel del instructor
            setTimeout(() => router.push('/instructor'), 1500);

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                const msg = err.response.data.error || err.response.data.mensaje || "Error al crear el curso.";
                toast.error(msg);
            } else {
                toast.error("Error de conexión con el servidor.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-3xl min-h-screen">

            {/* CABECERA */}
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="bg-slate-900 p-2 rounded-xl">
                    <Sparkles className="h-6 w-6 text-amber-400 fill-amber-400" aria-hidden="true" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Crear Nuevo Curso</h1>
                    <p className="text-slate-500 text-sm">Define la información básica de tu curso.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8 bg-white shadow-lg rounded-xl border border-slate-200" noValidate>

                {/* --- SECCIÓN DE IMAGEN --- */}
                <div className="space-y-3">
                    <Label className="text-slate-700 font-semibold">Portada del Curso <span className="text-slate-400 font-normal">(Opcional)</span></Label>

                    {portadaUrl ? (
                        <div className="relative w-full h-56 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group shadow-sm">
                            <img
                                src={portadaUrl}
                                alt="Vista previa de portada"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={() => setPortadaUrl("")}
                                    className="bg-white text-red-600 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-red-50 flex items-center gap-2 transition-transform hover:scale-105"
                                >
                                    <X size={16} /> Cambiar Imagen
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400 group-hover:text-slate-600">
                                    {uploading ? (
                                        <Loader2 className="animate-spin h-10 w-10 mb-2 text-slate-900" />
                                    ) : (
                                        <>
                                            <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                                                <ImageIcon className="h-6 w-6 text-slate-900" />
                                            </div>
                                            <p className="mb-1 text-sm font-semibold">Click para subir portada</p>
                                            <p className="text-xs opacity-70">JPG o PNG (Recomendado 1280x720)</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    disabled={uploading}
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>
                    )}
                </div>

                {/* TÍTULO */}
                <div className="space-y-2">
                    <Label htmlFor="titulo" className="text-slate-700 font-semibold">Título del Curso <span className="text-amber-500">*</span></Label>
                    <Input
                        id="titulo"
                        placeholder="Ej: Máster en Java Spring Boot"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className={`h-11 ${titulo.length > 0 && titulo.length < 5 ? "border-red-300 focus-visible:ring-red-300 bg-red-50" : "border-slate-200 focus-visible:ring-amber-500"}`}
                    />
                    {titulo.length > 0 && titulo.length < 5 && <p className="text-xs text-red-500 font-medium animate-pulse">Mínimo 5 caracteres</p>}
                </div>

                {/* DESCRIPCIÓN */}
                <div className="space-y-2">
                    <Label htmlFor="descripcion" className="text-slate-700 font-semibold">Descripción <span className="text-amber-500">*</span></Label>
                    <Textarea
                        id="descripcion"
                        placeholder="Detalla qué aprenderán los estudiantes..."
                        className={`min-h-[120px] resize-none ${descripcion.length > 0 && descripcion.length < 20 ? "border-red-300 bg-red-50" : "border-slate-200 focus-visible:ring-amber-500"}`}
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                    />
                    <div className="flex justify-end text-xs font-medium">
                        <span className={descripcion.length < 20 ? "text-slate-400" : "text-green-600 flex items-center gap-1"}>
                            {descripcion.length >= 20 && <CheckCircle2 size={12}/>}
                            {descripcion.length} caracteres
                        </span>
                    </div>
                </div>

                {/* PRECIO Y CATEGORÍAS (Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PRECIO */}
                    <div className="space-y-2">
                        <Label htmlFor="precio" className="text-slate-700 font-semibold">Precio (USD) <span className="text-amber-500">*</span></Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                            <Input
                                id="precio"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="pl-8 h-11 border-slate-200 focus-visible:ring-amber-500 font-medium"
                                value={precio}
                                onChange={handlePriceChange}
                            />
                        </div>
                    </div>

                    {/* CATEGORÍAS */}
                    <div className="space-y-2 relative">
                        <Label className="text-slate-700 font-semibold">Categorías <span className="text-amber-500">*</span></Label>

                        <div className="flex flex-wrap gap-2 mb-2 min-h-[2.75rem] p-2 bg-slate-50 rounded-md border border-slate-200 items-center">
                            {selectedCats.length === 0 && <span className="text-xs text-slate-400 italic">Sin categorías...</span>}
                            {selectedCats.map((cat, idx) => (
                                <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                    {cat}
                                    <button type="button" onClick={() => removeCategory(cat)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="relative">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Buscar o crear..."
                                    value={catInput}
                                    onChange={handleCatInputChange}
                                    onKeyDown={handleCatKeyDown}
                                    onFocus={() => { if(catInput) setShowDropdown(true) }}
                                    autoComplete="off"
                                    className="h-10 border-slate-200 focus-visible:ring-amber-500"
                                />
                                <Button type="button" size="icon" className="h-10 w-10 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200" onClick={() => addCategory(catInput)} disabled={!catInput.trim()}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {showDropdown && catInput.trim().length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-xl mt-1 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-1">
                                    {suggestions.length > 0 ? (
                                        suggestions.map((cat) => (
                                            <li key={cat.id} onClick={() => addCategory(cat.nombre)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 flex justify-between border-b border-slate-50 last:border-0">
                                                <span>{cat.nombre}</span>
                                                <span className="text-xs text-slate-400 font-medium">Seleccionar</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li onClick={() => addCategory(catInput)} className="px-4 py-3 bg-amber-50 hover:bg-amber-100 cursor-pointer text-sm text-amber-900 font-bold flex items-center gap-2">
                                            <Plus className="h-4 w-4" /> Crear "{normalize(catInput)}"
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex gap-4 pt-6 border-t border-slate-100 mt-4">
                    <Button
                        type="submit"
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 font-bold shadow-md hover:shadow-lg transition-all"
                        disabled={!isFormValid() || uploading || isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
                        {isSubmitting ? "Publicando..." : "Crear Curso"}
                    </Button>
                    <Button type="button" variant="outline" asChild className="flex-1 h-12 border-slate-300 text-slate-600 hover:bg-slate-50 font-medium">
                        <Link href="/instructor">Cancelar</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}