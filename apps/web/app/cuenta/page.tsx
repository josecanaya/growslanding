"use client";

import { useEffect, useState } from "react";

import PerfilUsuario from "./components/PerfilUsuario";
import Personalizacion from "./components/Personalizacion";
import Suscripcion from "./components/Suscripcion";
import DeveloperModePanel from "./components/DeveloperMode";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { SUBSCRIPTION_UI_COPY } from "@/lib/subscriptions/texts";

// Iconos simplificados
function SunIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#6d4be8]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#6d4be8]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

export default function CuentaPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    const saved = window.localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;
    let initialTheme: "light" | "dark" = "light";

    if (saved) {
      initialTheme = saved;
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      initialTheme = prefersDark ? "dark" : "light";
    }

    setTheme(initialTheme);
    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark"
    );
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    window.localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="min-h-screen bg-[#f7f6fb] p-10 transition-colors duration-500 dark:bg-[#151323]">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-semibold text-[#1d1b29] dark:text-[#f5f3fc]">
              {SUBSCRIPTION_UI_COPY.accountHeading}
            </h1>
            <p className="text-[#5b5570] dark:text-[#c2bddb]">
              {SUBSCRIPTION_UI_COPY.accountSubheading}
            </p>
            <div className="mt-3 h-[3px] w-20 rounded-full bg-[#6d4be8]" />
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-[#e3dff2] p-3 transition hover:bg-[#ede9fb] dark:border-[#2a263a] dark:hover:bg-[#2d2850]"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div className="flex flex-col gap-10">
          <PerfilUsuario />
          <Personalizacion />
          <Suscripcion />
          {isAdmin ? <DeveloperModePanel /> : null}
        </div>
      </div>
    </div>
  );
}
