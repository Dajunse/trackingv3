import { useMemo, useState, useEffect } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

/* ---------- Gráfico de flujo animado (SVG puro, sin libs) ---------- */
function FlowImpactChart() {
  // Etapas
  const stages = [
    "Planeación",
    "Corte",
    "Escuadre",
    "CNC",
    "Calidad",
    "Almacén",
  ] as const;
  const volumes = [100, 86, 78, 74, 70]; // grosor relativo entre etapas

  // Geometría
  const { width, height, paddingX, paths } = useMemo(() => {
    const width = 1100;
    const height = 320;
    const paddingX = 80;
    const yTop = 110;
    const yBottom = 210;
    const gapX = (width - paddingX * 2) / (stages.length - 1);

    const paths = stages.slice(0, -1).map((_, i) => {
      const x1 = paddingX + gapX * i;
      const x2 = paddingX + gapX * (i + 1);
      const y1 = i % 2 === 0 ? yTop : yBottom;
      const y2 = (i + 1) % 2 === 0 ? yTop : yBottom;
      const dx = (x2 - x1) * 0.55;
      const d = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
      return { id: `link-${i}`, d, x1, y1, x2, y2 };
    });

    return { width, height, paddingX, yTop, yBottom, paths };
  }, []);

  const thickness = (v: number) => 4 + (v / Math.max(...volumes)) * 16;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block h-[320px] w-full"
        role="img"
        aria-label="Flujo de manufactura con grosor por volumen y partículas animadas"
      >
        <defs>
          {/* Camino lila muy tenue */}
          <linearGradient id="grad-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(270 80% 75%)" stopOpacity="0.15" />
            <stop
              offset="50%"
              stopColor="hsl(270 80% 80%)"
              stopOpacity="0.15"
            />
            <stop
              offset="100%"
              stopColor="hsl(270 80% 85%)"
              stopOpacity="0.15"
            />
          </linearGradient>

          <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <text
          x={16}
          y={28}
          className="fill-neutral-500 dark:fill-neutral-400"
          fontSize="12"
          letterSpacing="0.08em"
        >
          Flujo de trabajo
        </text>

        {paths.map((p, i) => {
          const particleColors = [
            "#22c55e",
            "#facc15",
            "#ef4444",
            "#facc15",
            "#22c55e",
          ];
          const color = particleColors[i % particleColors.length];

          return (
            <g key={p.id}>
              <path
                id={p.id}
                d={p.d}
                fill="none"
                stroke="url(#grad-flow)"
                strokeWidth={thickness(volumes[i])}
                strokeLinecap="round"
                className="opacity-50"
                filter="url(#soft-glow)"
              />
              <circle r="6" fill={color} opacity="0.92">
                <animateMotion
                  dur={`${6 + i}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath href={`#${p.id}`} />
                </animateMotion>
              </circle>
            </g>
          );
        })}

        {stages.map((name, i) => {
          const x =
            i === 0
              ? paddingX
              : i === stages.length - 1
                ? width - paddingX
                : (paths[i - 1].x2 + (paths[i]?.x1 ?? paths[i - 1].x2)) / 2;
          const y = i % 2 === 0 ? 80 : 250;

          return (
            <g
              key={name}
              transform={`translate(${x}, ${y})`}
              className="text-neutral-600 dark:text-neutral-300"
            >
              <circle r={12} fill="currentColor" opacity="0.15" />
              <text
                textAnchor="middle"
                dy="0.35em"
                className="fill-current"
                fontSize="12"
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Tipos de Datos ---------- */

type OperacionesQueryResult = {
  operaciones: Array<{
    proyecto: {
      id: string;
      proyecto: string;
    };
    procesos: Array<{
      estado: string;
      proceso: { nombre: string };
      horaInicio?: string | null;
      tiempoEstimado?: number | null;
    }>;
  }>;
};

export default function ImpactoPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-100 via-white to-neutral-200 px-6 py-12 text-neutral-900 dark:from-black dark:via-neutral-950 dark:to-neutral-900 dark:text-neutral-100 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Seguimiento en tiempo real
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Cada proceso se muestra en su flujo actual
          </p>
        </header>

        {/* ===== Flujo animado ===== */}
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/70 p-6 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/60">
          <FlowImpactChart />
        </section>

        <section className="rounded-3xl border border-neutral-200/70 bg-white/70 p-6 shadow-lg backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/60">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            Avance por proyecto
          </h2>
          <ProjectProgress />
        </section>
      </div>
    </div>
  );
}

export function ProjectProgress() {
  const [tick, setTick] = useState(0);

  // Forzar re-renderizado cada minuto para actualizar cronómetros
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const GET_DATOS = gql`
    query GetAvanceProyectos {
      operaciones {
        id
        operacion
        workorder {
          cantidad
        }
        proyecto {
          id
          proyecto
        }
        procesos {
          id
          estado
          conteoActual
          proceso {
            nombre
          }
          horaInicio
          tiempoEstimado
        }
      }
    }
  `;

  const { loading, error, data } = useQuery<OperacionesQueryResult>(GET_DATOS);

  const rows = useMemo(() => {
    if (!data?.operaciones) return [];

    const proyectosMap = data.operaciones.reduce((acc: any, op: any) => {
      const projectId = op.proyecto.id;
      const cantidadWO = op.workorder.cantidad;

      if (!acc[projectId]) {
        acc[projectId] = {
          nombre: op.proyecto.proyecto,
          totalMeta: 0,
          totalActual: 0,
          tieneCuelloBotella: false,
          detalleProcesos: {}, // Agruparemos procesos similares de distintas operaciones
        };
      }

      const metaOp = op.procesos.length * cantidadWO;
      acc[projectId].totalMeta += metaOp;

      op.procesos.forEach((p: any, idx: number) => {
        acc[projectId].totalActual += p.conteoActual;

        // Lógica de alerta: si hay estancamiento entre pasos
        const piezasAnteriores =
          idx > 0 ? op.procesos[idx - 1].conteoActual : cantidadWO;
        if (piezasAnteriores - p.conteoActual > 5) {
          acc[projectId].tieneCuelloBotella = true;
        }

        // Consolidar procesos por nombre para el resumen
        const nombreProc = p.proceso.nombre;
        if (!acc[projectId].detalleProcesos[nombreProc]) {
          acc[projectId].detalleProcesos[nombreProc] = { actual: 0, meta: 0 };
        }
        acc[projectId].detalleProcesos[nombreProc].actual += p.conteoActual;
        acc[projectId].detalleProcesos[nombreProc].meta += cantidadWO;
      });

      return acc;
    }, {});

    return Object.entries(proyectosMap).map(([id, stats]: [string, any]) => {
      const pct =
        stats.totalMeta > 0
          ? Math.min(
              100,
              Math.round((stats.totalActual / stats.totalMeta) * 100),
            )
          : 0;
      return {
        id,
        proyecto: stats.nombre,
        pct,
        tieneCuelloBotella: stats.tieneCuelloBotella,
        procesos: stats.detalleProcesos,
        color:
          pct >= 100
            ? "bg-emerald-500"
            : pct >= 50
              ? "bg-blue-500"
              : "bg-amber-500",
      };
    });
  }, [data, tick]);

  if (loading)
    return (
      <p className="text-center py-4 text-sm animate-pulse">
        Cargando avance de producción...
      </p>
    );
  if (error)
    return (
      <p className="text-center py-4 text-rose-500 text-sm italic">
        Error: {error.message}
      </p>
    );

  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {rows.map((r) => (
        <AccordionItem
          key={r.id}
          value={r.id}
          className={cn(
            "rounded-xl border px-4 shadow-sm transition-all",
            r.tieneCuelloBotella
              ? "border-amber-200 bg-amber-50/20 dark:border-amber-900/40"
              : "border-neutral-200 bg-white/50 dark:border-neutral-800",
          )}
        >
          <AccordionTrigger className="hover:no-underline py-5">
            <div className="flex flex-col w-full pr-4 text-left">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold uppercase tracking-tight">
                    {r.proyecto}
                  </span>
                  {r.tieneCuelloBotella && (
                    <Badge className="bg-amber-500 text-black text-[9px] font-bold animate-pulse">
                      RETRASO
                    </Badge>
                  )}
                  {r.pct === 100 && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <span className="font-mono text-sm font-bold">{r.pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className={cn("h-full transition-all duration-1000", r.color)}
                  style={{ width: `${r.pct}%` }}
                />
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pb-6 border-t border-neutral-100 dark:border-neutral-800 mt-2 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(r.procesos).map(
                ([nombre, stat]: [string, any]) => (
                  <div
                    key={nombre}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800"
                  >
                    <span className="text-xs font-medium">{nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500">
                        {stat.actual} / {stat.meta}
                      </span>
                      <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-400"
                          style={{
                            width: `${(stat.actual / stat.meta) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
