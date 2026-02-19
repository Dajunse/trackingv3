import { Link } from "react-router-dom";
import {
  User,
  FolderPlus,
  Wrench,
  ArrowLeft,
  File,
  BotOffIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { DeleteWorkOrderCard } from "./components/DeleteWorkOrderCard";
import {
  CreateProjectCard,
  DeleteProjectCard,
} from "./components/ProjectManagementCards";
import {
  CreateUserCard,
  DeleteUserCard,
} from "./components/UserManagementCards";
import {
  CreateMachineCard,
  DeleteMachineCard,
} from "./components/MachineManagementCards";
import { ShutdownCard } from "./components/ShutdownCard";

export default function NewEntryPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-6 flex items-center justify-start">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
        </Button>
      </header>

      <h1 className="text-2xl font-semibold tracking-tight mb-8">
        Administración de Planta
      </h1>

      <Tabs defaultValue="workorder" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workorder" className="gap-2 cursor-pointer">
            <File className="h-4 w-4" /> Work Order
          </TabsTrigger>
          <TabsTrigger value="proyecto" className="gap-2 cursor-pointer">
            <FolderPlus className="h-4 w-4" /> Proyecto
          </TabsTrigger>
          <TabsTrigger value="usuario" className="gap-2 cursor-pointer">
            <User className="h-4 w-4" /> Usuario
          </TabsTrigger>
          <TabsTrigger value="maquina" className="gap-2 cursor-pointer">
            <Wrench className="h-4 w-4" /> Máquina
          </TabsTrigger>
          <TabsTrigger value="shutdown" className="gap-2 cursor-pointer">
            <BotOffIcon className="h-4 w-4" /> Shutdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workorder" className="mt-6">
          <DeleteWorkOrderCard />
        </TabsContent>

        <TabsContent value="proyecto" className="mt-6 space-y-8">
          <CreateProjectCard />
          <DeleteProjectCard />
        </TabsContent>

        <TabsContent value="usuario" className="mt-6 space-y-8">
          <CreateUserCard />
          <DeleteUserCard />
        </TabsContent>

        <TabsContent value="maquina" className="mt-6 space-y-8">
          <CreateMachineCard />
          <DeleteMachineCard />
        </TabsContent>

        <TabsContent value="shutdown" className="mt-6">
          <ShutdownCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
