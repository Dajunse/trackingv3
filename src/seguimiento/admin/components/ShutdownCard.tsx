import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { BotOffIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sileo } from "sileo";

interface ShutdownResponse {
  shutdownSesionesActivas: number;
}

export function ShutdownCard() {
  const SHUTDOWN = gql`
    mutation ManualShutdown {
      shutdownSesionesActivas
    }
  `;

  const [triggerShutdown, { loading }] =
    useMutation<ShutdownResponse>(SHUTDOWN);

  const handleShutdown = async () => {
    if (!window.confirm("¿PAUSAR TODA LA PLANTA?")) return;

    try {
      const { data } = await triggerShutdown();
      if (data) {
        sileo.success({
          title: "Shutdown completado",
          description: `Se han finalizado ${data.shutdownSesionesActivas} sesiones activas.`,
          position: "top-center",
          fill: "black",
          styles: {
            title: "text-white!",
            description: "text-white/75!",
          },
        });
      }
    } catch (e: any) {
      sileo.error({
        title: "Error en Shutdown",
        description: e.message,
        position: "top-center",
        fill: "black",
        styles: {
          title: "text-white!",
          description: "text-white/75!",
        },
      });
    }
  };

  return (
    <Card className="border-orange-500 bg-orange-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <BotOffIcon className="h-5 w-5" /> Shutdown General
        </CardTitle>
        <CardDescription className="text-orange-600">
          Finaliza todas las sesiones abiertas de forma inmediata.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-10">
        <Button
          variant="outline"
          className="h-20 w-60 border-orange-500 text-orange-600 font-black text-2xl"
          onClick={handleShutdown}
          disabled={loading}
        >
          {loading ? "..." : "SHUTDOWN"}
        </Button>
      </CardContent>
    </Card>
  );
}
