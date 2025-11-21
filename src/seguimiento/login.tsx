import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Necesitas useNavigate para redirigir
import { LogIn, User, Lock, ArrowLeft } from "lucide-react";

// --- Importa los componentes de shadcn/ui que estás usando ---
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ⚠️ ¡IMPORTANTE! Reemplaza esta URL con la ruta real de tu API de Django
const LOGIN_API_URL = "https://tracking00-production.up.railway.app/api/token/";
//const LOGIN_API_URL = "http://localhost:8000/api/token/";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ LOGIN EXITOSO

        // 1. Guardar los tokens (Acceso y Refresco)
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);

        // 2. Redirigir al usuario a la página protegida (o al inicio)
        navigate("/newentries", { replace: true });
      } else {
        // ❌ ERROR DE CREDENCIALES
        // Generalmente Django/Simple JWT retorna un mensaje en el campo 'detail'
        const errorMessage =
          data.detail || "Nombre de usuario o contraseña incorrectos.";
        setError(errorMessage);
      }
    } catch (e) {
      // 🌐 ERROR DE CONEXIÓN O DEL SERVIDOR
      console.error("Error de red/servidor:", e);
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <LogIn className="h-6 w-6" /> Iniciar Sesión
          </CardTitle>
          <CardDescription>
            Ingresa tu nombre de usuario y contraseña para acceder al sistema.
          </CardDescription>

          {/* Mensaje de error al fallar el login */}
          {error && (
            <div className="text-sm mt-2 p-3 rounded-md bg-rose-100 text-rose-700 border border-rose-300">
              {error}
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo de Nombre de Usuario */}
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Tu nombre de usuario"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo de Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Botón de Login */}
            <Button
              type="submit"
              className="w-full gap-2 mt-4 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                "Verificando..."
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Entrar
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-0">
          <Button asChild variant="link" className="text-sm text-gray-500">
            <Link to="/" className="gap-1">
              <ArrowLeft className="h-3 w-3" />
              Volver a la página principal
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
