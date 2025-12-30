"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AccessibilityContextType {
    highContrast: boolean;
    toggleHighContrast: () => void;
    fontSize: number; // 0: Normal, 1: Grande, 2: Muy Grande
    increaseFont: () => void;
    resetFont: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const [highContrast, setHighContrast] = useState(false);
    const [fontSize, setFontSize] = useState(0);

    // Aplicar clases al body cuando cambie el estado
    useEffect(() => {
        const root = document.documentElement;

        // 1. Manejo de Alto Contraste
        if (highContrast) {
            root.classList.add("high-contrast");
        } else {
            root.classList.remove("high-contrast");
        }

        // 2. Manejo de Tamaño de Fuente (Usando data attribute)
        root.setAttribute("data-font-size", fontSize.toString());

    }, [highContrast, fontSize]);

    const toggleHighContrast = () => setHighContrast(!highContrast);

    const increaseFont = () => setFontSize(prev => (prev < 2 ? prev + 1 : 0)); // Ciclo: 0 -> 1 -> 2 -> 0
    const resetFont = () => setFontSize(0);

    return (
        <AccessibilityContext.Provider value={{ highContrast, toggleHighContrast, fontSize, increaseFont, resetFont }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) throw new Error("useAccessibility debe usarse dentro de un AccessibilityProvider");
    return context;
};