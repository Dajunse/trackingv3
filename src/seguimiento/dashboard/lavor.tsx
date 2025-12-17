import { useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Calendar as CalendarIcon,
  AlertTriangle,
  Activity,
  Timer,
  Hourglass,
  RefreshCcw,
} from "lucide-react";

/* ============================
   Tipos GraphQL y Respuesta
================================ */

type ProcesoAsignado = {
  proceso: {
    nombre: string;
  };
  tiempoEstimado?: number | null;
  horaInicio?: string | null;
  horaFin?: string | null;
  tiempoRealCalculado?: number | null;
  operacion: {
    operacion: string;
    proyecto?: {
      proyecto: string;
    } | null;
  };
  maquina?: {
    nombre: string;
  } | null;
};

interface GetUsuariosData {
  usuarios: {
    id: string;
    numero: string;
    nombre: string;
  }[];
}

interface GetUserData {
  usuario: {
    id: string;
    nombre: string;
    procesosAsignados: ProcesoAsignado[];
  } | null;
}

type Interval = {
  start: string;
  end: string;
  minutes: number;
  kind: "work" | "break" | "unknown";
  maquinaNombre: string;
  operacion: string;
  proyecto: string;
  tiempoEstimado: number;
};

type TimelineResult = {
  intervals: Interval[];
  totalWorkMin: number;
};

/* ============================
   Queries GraphQL
================================ */

const GET_USUARIOS = gql`
  query GetUsuarios {
    usuarios {
      id
      numero
      nombre
    }
  }
`;

const GET_USUARIO = gql`
  query GetUsuario($numero: String!, $fecha: Date) {
    usuario(numero: $numero, fecha: $fecha) {
      id
      nombre
      procesosAsignados {
        proceso {
          nombre
        }
        tiempoEstimado
        horaInicio
        horaFin
        tiempoRealCalculado
        operacion {
          operacion
          proyecto {
            proyecto
          }
        }
        maquina {
          nombre
        }
      }
    }
  }
`;

/* ============================
   Utilidades
================================ */

function diffMinutes(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / 60000);
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildTimelineFromGraphQL(
  data: ProcesoAsignado[] | undefined
): TimelineResult {
  if (!data || data.length === 0) {
    return { intervals: [], totalWorkMin: 0 };
  }

  const intervals: Interval[] = [];
  let totalWorkMin = 0;

  const startedProcesses = data.filter((p) => p.horaInicio);

  for (const proc of startedProcesses) {
    const start = new Date(proc.horaInicio!);
    const end = proc.horaFin ? new Date(proc.horaFin) : new Date();
    const tiempoReal = proc.tiempoRealCalculado ?? diffMinutes(start, end);

    if (tiempoReal > 0) {
      intervals.push({
        start: proc.horaInicio!,
        end: proc.horaFin ?? end.toISOString(),
        minutes: Math.round(tiempoReal),
        kind: "work",
        maquinaNombre: proc.maquina?.nombre ?? "N/A",
        operacion: proc.operacion.operacion ?? "N/A",
        proyecto: proc.operacion.proyecto?.proyecto ?? "N/A",
        tiempoEstimado: proc.tiempoEstimado ?? 0,
      });
      totalWorkMin += Math.round(tiempoReal);
    }
  }

  intervals.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  return { intervals, totalWorkMin };
}

/* ============================
   Componente principal
================================ */

export default function LavorPage() {
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery<GetUsuariosData>(GET_USUARIOS);

  const [currentSelectedNumero, setCurrentSelectedNumero] =
    useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("ALL_PROJECTS");
  // Estado de fecha como Objeto Date para Shadcn
  const [date, setDate] = useState<Date | undefined>(new Date());

  const { employees, defaultNumero } = useMemo(() => {
    if (usersData?.usuarios) {
      const validUsers = usersData.usuarios.filter(
        (emp) => emp.numero && emp.numero !== ""
      );
      return {
        employees: validUsers,
        defaultNumero: validUsers.length > 0 ? validUsers[0].numero : "",
      };
    }
    return { employees: [], defaultNumero: "" };
  }, [usersData]);

  const selectedEmployeeNumero = currentSelectedNumero || defaultNumero;

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery<GetUserData>(GET_USUARIO, {
    variables: {
      numero: selectedEmployeeNumero,
      // Formato YYYY-MM-DD para el schema de Django
      fecha: date ? format(date, "yyyy-MM-dd") : null,
    },
    skip: !selectedEmployeeNumero,
  });

  const allProcesos = userData?.usuario?.procesosAsignados as
    | ProcesoAsignado[]
    | undefined;
  const timeline = useMemo(
    () => buildTimelineFromGraphQL(allProcesos),
    [allProcesos]
  );

  const employeeName =
    userData?.usuario?.nombre ??
    employees.find((e) => e.numero === selectedEmployeeNumero)?.nombre ??
    "—";

  const uniqueProjects = useMemo(() => {
    const projects = new Set<string>();
    timeline.intervals.forEach((itv) => {
      if (itv.proyecto && itv.proyecto !== "N/A") projects.add(itv.proyecto);
    });
    return Array.from(projects).sort();
  }, [timeline.intervals]);

  const filteredIntervals = useMemo(() => {
    if (!projectFilter || projectFilter === "ALL_PROJECTS")
      return timeline.intervals;
    return timeline.intervals.filter((itv) => itv.proyecto === projectFilter);
  }, [timeline.intervals, projectFilter]);

  const shiftDurationMin = 9 * 60;
  const utilizationPct =
    shiftDurationMin > 0
      ? Math.round((timeline.totalWorkMin / shiftDurationMin) * 100)
      : 0;

  if (usersLoading) return <LoadingState text="Cargando operadores..." />;
  if (usersError)
    return (
      <ErrorState
        message={`Error al cargar operadores: ${usersError.message}`}
      />
    );
  if (userLoading) return <LoadingState text={`Consultando actividades...`} />;
  if (userError)
    return (
      <ErrorState message={`Error al cargar procesos: ${userError.message}`} />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-200 px-6 py-10 text-neutral-900 dark:from-black dark:via-neutral-950 dark:to-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Seguimiento por Operador
            </motion.h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Panel de métricas y tiempos reales.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Selector de Operador */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <User className="h-3 w-3" /> Operador
              </Label>
              <Select
                value={selectedEmployeeNumero}
                onValueChange={setCurrentSelectedNumero}
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Seleccione Operador" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.numero}>
                      {emp.numero} · {emp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Fecha (Shadcn Calendar) */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> Fecha
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-52 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={es}
                  />
                  <div className="border-t p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs gap-2"
                      onClick={() => setDate(new Date())}
                    >
                      <RefreshCcw className="h-3 w-3" /> Ir a Hoy
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-[2fr,1.5fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" /> Resumen del Día
              </CardTitle>
              <CardDescription>
                {selectedEmployeeNumero} · {employeeName} (
                {date ? format(date, "dd/MM/yyyy") : ""})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4 text-sm">
                <SummaryChip
                  label="Total Procesos"
                  value={`${(timeline.totalWorkMin / 60).toFixed(2)} h`}
                  detail={`${timeline.totalWorkMin} min`}
                />
                <SummaryChip label="Pausas" value="N/A" muted />
                <SummaryChip label="Gaps" value="N/A" />
                <SummaryChip label="Extras" value="N/A" />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Utilización (Jornada {shiftDurationMin / 60}h)</span>
                  <span className="font-medium">{utilizationPct}%</span>
                </div>
                <Progress value={utilizationPct} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hourglass className="h-4 w-4 text-sky-500" /> Desempeño
              </CardTitle>
              <CardDescription>Eficiencia basada en estimados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-neutral-500">
                Filtrado activo para la fecha seleccionada en el servidor.
              </p>
              <Separator />
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Timer className="h-3 w-3" />
                <span>Solo se muestran procesos con registros de tiempo.</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">
                  Detalle de Operaciones
                </CardTitle>
                <CardDescription>
                  Listado de procesos filtrados por proyecto.
                </CardDescription>
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_PROJECTS">
                    Todos los proyectos
                  </SelectItem>
                  {uniqueProjects.map((proj) => (
                    <SelectItem key={proj} value={proj}>
                      {proj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Inicio</TableHead>
                      <TableHead className="text-center">Fin</TableHead>
                      <TableHead className="text-center">Estimado</TableHead>
                      <TableHead className="text-center">Real</TableHead>
                      <TableHead className="text-center">Proceso</TableHead>
                      <TableHead className="text-center">Estación</TableHead>
                      <TableHead className="text-center">Proyecto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIntervals.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-sm text-neutral-500"
                        >
                          No hay datos para esta fecha o proyecto.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredIntervals.map((itv, idx) => {
                        const start = new Date(itv.start);
                        const end = new Date(itv.end);
                        let durationStyle = "";
                        if (itv.minutes > 0 && itv.tiempoEstimado > 0) {
                          if (itv.minutes < itv.tiempoEstimado)
                            durationStyle = "text-emerald-600 font-medium";
                          else if (itv.minutes > itv.tiempoEstimado * 1.1)
                            durationStyle = "text-red-600 font-medium";
                        }
                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-center whitespace-nowrap font-mono">
                              {formatTime(start)}
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap font-mono">
                              {itv.end === new Date().toISOString()
                                ? "En Curso"
                                : formatTime(end)}
                            </TableCell>
                            <TableCell className="text-center text-neutral-500 font-mono">
                              {itv.tiempoEstimado
                                ? `${itv.tiempoEstimado.toFixed(0)}m`
                                : "-"}
                            </TableCell>
                            <TableCell
                              className={`text-center font-mono ${durationStyle}`}
                            >
                              {itv.minutes.toFixed(0)}m
                            </TableCell>
                            <TableCell className="text-center text-sm truncate max-w-[150px]">
                              {itv.operacion}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {itv.maquinaNombre}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {itv.proyecto}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function SummaryChip({ label, value, detail, muted, warn, highlight }: any) {
  let bg =
    "bg-neutral-50 border-neutral-200 text-neutral-800 dark:bg-neutral-900";
  if (muted)
    bg =
      "bg-neutral-100/70 border-neutral-200 text-neutral-700 dark:bg-neutral-900/70";
  if (warn) bg = "bg-amber-50 border-amber-200 text-amber-800";
  if (highlight) bg = "bg-emerald-50 border-emerald-200 text-emerald-800";

  return (
    <div className={`rounded-xl border px-3 py-2 ${bg}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70 font-bold">
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
      {detail && <div className="text-[10px] opacity-60">{detail}</div>}
    </div>
  );
}

function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <RefreshCcw className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-neutral-500 font-medium">{text}</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-3 p-6 border border-red-200 rounded-xl bg-red-50 text-red-800">
        <AlertTriangle className="h-8 w-8" />
        <p className="font-bold">Error de Datos</p>
        <p className="text-sm max-w-xs text-center">{message}</p>
      </div>
    </div>
  );
}
