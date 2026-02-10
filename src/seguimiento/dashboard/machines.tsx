import React, { useEffect, useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// -------------------------------
// 1. Tipos Locales y Utilerías
// -------------------------------
type MachineStatus = "running" | "idle" | "maintenance" | "paused";

type Machine = {
  id: string;
  name: string;
  piece?: string | null;
  operator?: string | null;
  status: MachineStatus;
  startedAt?: string | null;
  cycleTargetMin?: number;
  operationId?: string;
};

type GetProcesosOperacionQuery = {
  procesosOperacion: Array<{
    id: string;
    operacion: { operacion: string };
    maquina: { nombre: string } | null;
    usuario: { nombre: string } | null;
    proceso: { nombre: string } | null;
    estado: string;
    tiempoEstimado: number;
    horaInicio?: string | null;
  }>;
};

type ProcesosOpQueryResult = GetProcesosOperacionQuery;

function minsSince(ts?: string | null) {
  if (!ts) return 0;
  const diffMs = Date.now() - new Date(ts).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

function fmtElapsed(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function barPct(elapsed: number, target: number) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((elapsed / target) * 100));
}

function mapStatus(serverStatus: string): MachineStatus {
  const lowerStatus = serverStatus.toLowerCase();
  if (lowerStatus === "paused") return "paused";
  if (lowerStatus === "in_progress") return "running";
  return "idle";
}

function statusColor(machine: Machine) {
  // NARANJA EXCLUSIVO PARA PAUSA
  if (machine.status === "paused")
    return {
      bg: "bg-orange-50",
      border: "border-orange-200",
      dot: "bg-orange-500",
      text: "text-orange-700",
      bar: "bg-orange-500",
    };

  if (machine.status === "idle")
    return {
      bg: "bg-slate-50",
      border: "border-slate-200",
      dot: "bg-slate-400",
      text: "text-slate-700",
      bar: "bg-slate-500",
    };

  // running -> depende de thresholds
  const elapsed = minsSince(machine.startedAt);
  const X = machine.cycleTargetMin ?? 30;

  if (elapsed > 2 * X)
    return {
      bg: "bg-red-50",
      border: "border-red-200",
      dot: "bg-red-500",
      text: "text-red-700",
      bar: "bg-red-500",
    };

  if (elapsed > X)
    return {
      // CAMBIO: Se usa Amarillo en lugar de Ámbar para no confundir con Naranja
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      dot: "bg-yellow-500",
      text: "text-yellow-700",
      bar: "bg-yellow-500",
    };

  return {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
  };
}

// -------------------------------
// 2. Transformación con Filtros Estrictos
// -------------------------------
function transformDataToMachines(data: ProcesosOpQueryResult): Machine[] {
  if (!data?.procesosOperacion) return [];

  const activeStatuses = ["in_progress", "paused"];

  return data.procesosOperacion
    .filter(
      (item) =>
        item &&
        item.maquina?.nombre && // Solo si tiene máquina asignada
        activeStatuses.includes(item.estado?.toLowerCase()), // Solo activas o pausadas
    )
    .map((item) => {
      return {
        id: item.id,
        name: item.maquina!.nombre,
        piece: item.proceso?.nombre || null,
        operator: item.usuario?.nombre || null,
        status: mapStatus(item.estado),
        startedAt: item.horaInicio || null,
        cycleTargetMin: item.tiempoEstimado,
        operationId: item.operacion?.operacion || "S/N",
      };
    });
}

// -------------------------------
// 3. Componente Principal
// -------------------------------
export default function MaquinasDashboard() {
  const GET_DATOS = gql`
    query GetProcesosOperacion {
      procesosOperacion {
        id
        operacion {
          operacion
        }
        maquina {
          nombre
        }
        usuario {
          nombre
        }
        proceso {
          nombre
        }
        estado
        tiempoEstimado
        horaInicio
      }
    }
  `;

  const { loading, error, data, refetch } =
    useQuery<ProcesosOpQueryResult>(GET_DATOS);

  const machines = useMemo(
    () => (data ? transformDataToMachines(data) : []),
    [data],
  );

  // Estadísticas rápidas
  const stats = useMemo(() => {
    return {
      working: machines.filter((m) => m.status === "running").length,
      paused: machines.filter((m) => m.status === "paused").length,
    };
  }, [machines]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MachineStatus>(
    "all",
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTick((n) => n + 1);
      refetch();
    }, 30000);
    return () => clearInterval(t);
  }, [refetch]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return machines.filter((m) => {
      const okStatus =
        statusFilter === "all" ? true : m.status === statusFilter;
      const okTerm =
        term.length === 0 ||
        m.name.toLowerCase().includes(term) ||
        (m.piece ?? "").toLowerCase().includes(term) ||
        (m.operator ?? "").toLowerCase().includes(term);
      return okStatus && okTerm;
    });
  }, [machines, q, statusFilter, tick]);

  if (loading)
    return <div className="p-8 text-center text-lg">Cargando Dashboard...</div>;
  if (error)
    return (
      <div className="p-8 text-center text-red-600">Error: {error.message}</div>
    );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard de Máquinas
          </h1>

          {/* Widgets de Resumen */}
          <div className="mt-4 flex gap-4">
            <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col min-w-[120px]">
              <span className="text-xs text-muted-foreground uppercase">
                Trabajando
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                {stats.working}
              </span>
            </div>
            <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col min-w-[120px]">
              <span className="text-xs text-muted-foreground uppercase">
                Pausadas
              </span>
              <span className="text-2xl font-bold text-orange-600">
                {stats.paused}
              </span>
            </div>
          </div>
        </header>

        {/* Controles */}
        <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1">
            <Input
              placeholder="Buscar máquina u operador..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="w-full md:w-56">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las activas</SelectItem>
                <SelectItem value="running">En Proceso</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Leyenda Actualizada */}
        <div className="mb-4 flex flex-wrap gap-4 text-xs">
          <LegendDot className="bg-emerald-500" label="A tiempo (≤ X)" />
          <LegendDot className="bg-yellow-500" label="Retraso leve (> X)" />
          <LegendDot className="bg-red-500" label="Retraso severo (> 2× X)" />
          <LegendDot className="bg-orange-500" label="PAUSADO" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <MachineCard key={m.id} m={m} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-slate-500 mt-12">
            No hay máquinas activas con los criterios seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------
// Subcomponentes
// -------------------------------
function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      <span className="text-muted-foreground font-medium">{label}</span>
    </span>
  );
}

function MachineCard({ m }: { m: Machine }) {
  const elapsed = minsSince(m.startedAt);
  const X = m.cycleTargetMin ?? 30;
  const pct = barPct(elapsed, X);
  const color = statusColor(m);

  return (
    <Card className={`border-2 transition-colors ${color.border} ${color.bg}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">{m.name}</CardTitle>
          <span className={`h-3 w-3 rounded-full animate-pulse ${color.dot}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="WO / Pieza">
          <strong>{m.operationId}</strong>
        </Row>
        <Row label="Operador">{m.operator || "—"}</Row>
        <Row label="Transcurrido">
          {m.status === "running" ? fmtElapsed(elapsed) : "Pausado"}
        </Row>
        <Row label="Objetivo X">{X} min</Row>

        {m.status === "running" && X > 0 && (
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
              <div
                className={`h-2 transition-all ${color.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className={`mt-1 text-[11px] font-medium ${color.text}`}>
              {pct}% del tiempo objetivo
            </div>
          </div>
        )}

        <div className="pt-2">
          {m.status === "running" ? (
            <Badge className="bg-emerald-600">En Proceso</Badge>
          ) : (
            <Badge className="bg-orange-600">Pausado</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}
