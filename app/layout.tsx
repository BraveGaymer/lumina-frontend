import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

// 1. CONTEXTO Y WIDGET DE ACCESIBILIDAD
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AccessibilityWidget } from "@/components/ui/accessibility-widget";

// 2. TOASTER (Notificaciones)
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        template: "%s | Lumina Learning",
        default: "Lumina Learning",
    },
    description: "Plataforma de educación online profesional.",
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
        <body
            className={`${inter.className} ${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-100 selection:text-blue-900`}
        >
        {/* PROVEEDOR DE ACCESIBILIDAD */}
        <AccessibilityProvider>

            <Navbar />

            {/* Contenedor principal con transición de colores para accesibilidad */}
            <main className="min-h-screen bg-gray-50 transition-colors duration-300 ease-in-out">
                {children}
            </main>

            {/* Componentes de UI Globales */}
            <AccessibilityWidget />

            {/* Toaster con richColors para mejor contraste en avisos de éxito/error */}
            <Toaster position="top-center" richColors closeButton />

        </AccessibilityProvider>
        </body>
        </html>
    );
}