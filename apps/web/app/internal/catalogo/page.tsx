"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CatalogoEditor from "@/components/internal/CatalogoEditor";
import { Lock } from "lucide-react";

// Credenciales hardcodeadas (solo para uso interno)
const VALID_USERNAME = "Josecontrera";
const VALID_PASSWORD = "juliorenzo83";

export default function CatalogoEditorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Verificar si ya está autenticado (localStorage)
  useEffect(() => {
    const authStatus = localStorage.getItem("catalogo_editor_auth");
    if (authStatus === "authenticated") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("catalogo_editor_auth", "authenticated");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("catalogo_editor_auth");
    setUsername("");
    setPassword("");
  };

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-600" />
              <CardTitle>Acceso al Editor de Catálogo</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Usuario
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full">
                Ingresar
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Editor interno - Solo para administradores
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar editor si está autenticado
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-2 flex justify-end">
        <Button onClick={handleLogout} variant="outline" size="sm">
          Cerrar Sesión
        </Button>
      </div>
      <CatalogoEditor />
    </div>
  );
}

