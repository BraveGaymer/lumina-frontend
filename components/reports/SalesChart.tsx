"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Rectangle
} from 'recharts';

interface ChartData {
    name: string;
    ventas: number;
    ingresos: number;
}

interface SalesChartProps {
    data: ChartData[];
}

// Componente personalizado para el Tooltip (el cuadrito flotante al pasar el mouse)
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg min-w-[150px] animate-in fade-in zoom-in duration-200">
                <p className="font-bold text-slate-800 mb-2 border-b border-slate-50 pb-1 text-xs uppercase tracking-wider">{label}</p>
                <div className="space-y-1">
                    <p className="text-emerald-600 font-bold text-sm flex justify-between gap-4">
                        <span>Ingresos:</span>
                        <span>${payload[0].value.toFixed(2)}</span>
                    </p>
                    <p className="text-slate-500 text-xs flex justify-between gap-4">
                        <span>Ventas:</span>
                        <span>{payload[0].payload.ventas} u.</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export function SalesChart({ data }: SalesChartProps) {
    return (
        <div className="h-[300px] w-full animate-in fade-in zoom-in duration-500">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    {/* Definición del Gradiente Esmeralda para las barras */}
                    <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/> {/* Emerald-500 */}
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /> {/* Slate-100 */}

                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8" // Slate-400
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                    />

                    <YAxis
                        stroke="#94a3b8" // Slate-400
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />

                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} /> {/* Slate-50 hover background */}

                    <Bar
                        dataKey="ingresos"
                        fill="url(#colorIngresos)"
                        radius={[6, 6, 0, 0]}
                        barSize={40}
                        // Efecto visual al pasar el mouse por encima de una barra
                        activeBar={<Rectangle fill="#059669" stroke="#047857" />}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}