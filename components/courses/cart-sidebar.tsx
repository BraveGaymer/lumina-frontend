"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Loader2, CreditCard, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import { toast } from "sonner";
import api from "@/lib/axios"; // <--- Tu nueva conexión

// --- DEFINICIÓN DE TIPOS ---
interface CartItem {
    cartItemId: string;
    cursoId: string;
    cursoTitulo: string;
    cursoPrecio: number;
    addedAt: string;
}

export function CartSidebar() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [couponCode, setCouponCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    // --- CARGAR CARRITO ---
    const fetchCart = async () => {
        // Verificación rápida (si no hay token, no intentamos cargar)
        if (!localStorage.getItem('jwtToken')) return;

        setIsLoading(true);
        try {
            // Axios con GET
            const response = await api.get('/cart');
            setCartItems(response.data);
        } catch (error) {
            console.error("Error al cargar carrito", error);
            // No mostramos toast invasivo aquí para no molestar al usuario si solo está navegando
        } finally {
            setIsLoading(false);
        }
    };

    // Efecto: Cargar cuando se abre el panel
    useEffect(() => {
        if (isOpen) {
            fetchCart();
        }
    }, [isOpen]);

    // --- ELIMINAR ÍTEM ---
    const handleRemoveItem = async (itemId: string) => {
        try {
            // Axios con DELETE
            await api.delete(`/cart/${itemId}`);

            // Recargar lista y avisar
            fetchCart();
            toast.success("Curso eliminado del carrito");
        } catch (error) {
            console.error(error);
            toast.error("No se pudo eliminar el curso");
        }
    };

    // --- PROCESAR PAGO ---
    const handleCheckout = async () => {
        setIsProcessing(true);

        try {
            // Axios con POST
            const response = await api.post('/pagos/checkout', { codigoCupon: couponCode });

            // Éxito
            const result = response.data;
            toast.success("¡Pago exitoso!", {
                description: `Total pagado: $${result.montoPagado}. Disfruta tu aprendizaje.`
            });

            setIsOpen(false);
            router.push('/my-courses');

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                // Error específico del backend (ej: cupón inválido, saldo insuficiente, etc.)
                toast.error(err.response.data.error || "Error al procesar el pago.");
            } else {
                toast.error("Error de conexión con la pasarela de pagos.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + item.cursoPrecio, 0);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            {/* BOTÓN DISPARADOR (TRIGGER) PARA EL NAVBAR */}
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    aria-label={`Ver carrito de compras, ${cartItems.length} items`}
                >
                    <ShoppingCart className="h-6 w-6" aria-hidden="true" />
                    {cartItems.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-amber-500 hover:bg-amber-600 text-white border-2 border-white rounded-full text-[10px]">
                            {cartItems.length}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>

            {/* CONTENIDO DEL PANEL */}
            <SheetContent className="flex flex-col w-full sm:max-w-md border-l-slate-200">
                <SheetHeader className="pb-4 border-b border-slate-100">
                    <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <div className="bg-slate-100 p-2 rounded-lg">
                            <ShoppingCart className="h-5 w-5 text-slate-700" aria-hidden="true" />
                        </div>
                        Tu Carrito
                    </SheetTitle>
                </SheetHeader>

                {/* LISTA DE ÍTEMS */}
                <ScrollArea className="flex-1 -mx-6 px-6 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
                            <p className="text-sm">Cargando cursos...</p>
                        </div>
                    ) : cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="bg-slate-50 p-4 rounded-full">
                                <Sparkles className="h-10 w-10 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-900 font-medium">Tu carrito está vacío</p>
                                <p className="text-slate-500 text-sm">¡Descubre cursos increíbles para empezar!</p>
                            </div>
                            <SheetClose asChild>
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white" asChild>
                                    <Link href="/courses">Explorar Catálogo</Link>
                                </Button>
                            </SheetClose>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.cartItemId} className="flex justify-between items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">{item.cursoTitulo}</h4>
                                        <p className="text-slate-500 font-semibold mt-1.5 text-sm">${item.cursoPrecio.toFixed(2)}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2"
                                        onClick={() => handleRemoveItem(item.cartItemId)}
                                        aria-label={`Eliminar curso ${item.cursoTitulo} del carrito`}
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* FOOTER: TOTAL, CUPÓN Y CHECKOUT */}
                {cartItems.length > 0 && (
                    <SheetFooter className="mt-auto sm:flex-col gap-4 border-t border-slate-100 pt-6">

                        {/* Cupón */}
                        <div className="space-y-2">
                            <label htmlFor="coupon" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Cupón de descuento
                            </label>
                            <Input
                                id="coupon"
                                placeholder="CÓDIGO"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="h-10 text-sm border-slate-200 focus-visible:ring-amber-500 uppercase placeholder:normal-case"
                                aria-label="Ingresar código de cupón"
                            />
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="text-slate-600 font-medium">Total a pagar</span>
                            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">${totalAmount.toFixed(2)}</span>
                        </div>

                        {/* Botón Pagar */}
                        <Button
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            aria-label={`Pagar el total de $${totalAmount.toFixed(2)}`}
                        >
                            {isProcessing ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
                            ) : (
                                <><CreditCard className="mr-2 h-5 w-5" /> Pagar Ahora</>
                            )}
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}