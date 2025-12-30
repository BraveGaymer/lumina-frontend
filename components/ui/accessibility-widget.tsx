"use client";

import React from "react";
import { useAccessibility } from "@/context/AccessibilityContext";
import { Button } from "@/components/ui/button";
import {
    Accessibility,
    Sun,
    Type,
    RotateCcw
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function AccessibilityWidget() {
    const { highContrast, toggleHighContrast, fontSize, increaseFont, resetFont } = useAccessibility();

    // Función auxiliar para resetear inteligentemente
    const handleReset = () => {
        resetFont();
        // Solo ejecutamos el toggle si el alto contraste ESTÁ activo.
        // Si ya está apagado, no hacemos nada.
        if (highContrast) {
            toggleHighContrast();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 print:hidden">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700 shadow-2xl border-4 border-white transition-transform hover:scale-110 focus:ring-4 focus:ring-blue-300"
                        aria-label="Opciones de accesibilidad"
                    >
                        <Accessibility className="h-8 w-8 text-white" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-5 mr-4 mb-2 bg-white border border-slate-200 shadow-2xl rounded-xl" side="top" align="end">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg border-b pb-2">
                        <Accessibility className="h-5 w-5 text-blue-600"/> Accesibilidad
                    </h3>

                    <div className="space-y-4">
                        {/* Botón Alto Contraste */}
                        <Button
                            variant={highContrast ? "default" : "outline"}
                            className={`w-full justify-start h-12 text-base font-medium ${
                                highContrast
                                    ? "bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-500"
                                    : "hover:bg-slate-50 text-slate-700"
                            }`}
                            onClick={toggleHighContrast}
                        >
                            <Sun className={`mr-3 h-5 w-5 ${highContrast ? "fill-black" : ""}`} />
                            {highContrast ? "Desactivar Contraste" : "Activar Alto Contraste"}
                        </Button>

                        {/* Botón Tamaño Letra */}
                        <Button
                            variant="outline"
                            className="w-full justify-start h-12 text-base font-medium text-slate-700 hover:bg-slate-50"
                            onClick={increaseFont}
                        >
                            <Type className="mr-3 h-5 w-5" />
                            Tamaño: <span className="ml-1 font-bold text-blue-600">
                                {fontSize === 0 ? "Normal" : fontSize === 1 ? "Grande" : "Extra Grande"}
                            </span>
                        </Button>

                        {/* Reset */}
                        <Button
                            variant="ghost"
                            className="w-full text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 mt-2"
                            onClick={handleReset}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Restablecer configuración
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}