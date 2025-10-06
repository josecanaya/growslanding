import PerfilUsuario from "./components/PerfilUsuario"
import Personalizacion from "./components/Personalizacion"
import Suscripcion from "./components/Suscripcion"

export default function CuentaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Configuración de Cuenta</h1>
      <p className="text-gray-500 mb-4">
        Gestioná tus datos personales, preferencias y suscripción
      </p>
      <PerfilUsuario />
      <Personalizacion />
      <Suscripcion />
    </div>
  )
}