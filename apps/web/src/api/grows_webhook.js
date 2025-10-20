import axios from "axios";

const REQUIRED_FIELDS = ["sessionId", "action", "chatinput"];

/**
 * Validates and normalizes the payload before sending it to the webhook.
 * @param {unknown} payload
 * @returns {{ sessionId: string; action: string; chatinput: string } & Record<string, unknown>}
 */
function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(
      "Payload invalido: se esperaba un objeto con sessionId, action y chatinput."
    );
  }

  const normalized = { ...payload };
  const missingFields = [];
  for (const field of REQUIRED_FIELDS) {
    const value = normalized[field];
    if (value === undefined || value === null) {
      missingFields.push(field);
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        missingFields.push(field);
        continue;
      }
      normalized[field] = trimmed;
    }
  }

  if (missingFields.length > 0) {
    throw new Error(
      "Payload incompleto: faltaron los campos " + missingFields.join(", ") + "."
    );
  }

  return normalized;
}
/**
 * Envia mensajes al webhook de n8n configurado en el entorno.
 * @param {{ sessionId: string; action: string; chatinput: string } & Record<string, unknown>} payload
 * @returns {Promise<unknown>}
 */
export async function enviarMensajeAGrowsN8n(payload) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    const message =
      "WARN Falto configurar N8N_WEBHOOK_URL en .env (ej: http://localhost:5678/webhook/grows_in)";
    console.error(message);
    throw new Error(message);
  }

  const normalizedPayload = validatePayload(payload);

  console.log("INFO Enviando mensaje a n8n:", {
    sessionId: normalizedPayload.sessionId,
    action: normalizedPayload.action,
    chatinput: normalizedPayload.chatinput,
  });

  try {
    const response = await axios.post(webhookUrl, normalizedPayload, {
      headers: { "Content-Type": "application/json" },
      timeout: 25000,
    });

    console.log("INFO Respuesta de n8n:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      console.error("ERROR Conectando con n8n:", {
        message: error.message,
        status,
        data,
      });

      const statusMsg = status ? " (status " + status + ")" : "";
      throw new Error("Error al conectar con n8n" + statusMsg + ": " + error.message);
    }

    console.error("ERROR Inesperado al conectar con n8n:", error);
    throw new Error("Error inesperado al conectar con n8n: " + error.message);
  }
}

export default enviarMensajeAGrowsN8n;
/**
 * Ejemplo de endpoint /api/chat con Express:
 *
 * import express from "express";
 * import enviarMensajeAGrowsN8n from "./src/api/grows_webhook.js";
 *
 * const router = express.Router();
 * router.post("/api/chat", async (req, res) => {
 *   try {
 *     const data = await enviarMensajeAGrowsN8n(req.body ?? {});
 *     res.status(200).json({ success: true, data });
 *   } catch (error) {
 *     console.error("Error en /api/chat (Express):", error);
 *     const message = error instanceof Error ? error.message : "Error desconocido";
 *     res.status(500).json({ success: false, error: message });
 *   }
 * });
 *
 * export default router;
 */
/**
 * Ejemplo de endpoint /api/chat con Next.js 14 App Router (app/api/chat/route.js):
 *
 * import { NextResponse } from "next/server";
 * import { enviarMensajeAGrowsN8n } from "@/src/api/grows_webhook";
 *
 * export async function POST(request) {
 *   try {
 *     const body = await request.json();
 *     const data = await enviarMensajeAGrowsN8n(body);
 *     return NextResponse.json({ success: true, data });
 *   } catch (error) {
 *     console.error("Error en /api/chat (Next.js):", error);
 *     const message = error instanceof Error ? error.message : "Error desconocido";
 *     return NextResponse.json({ success: false, error: message }, { status: 500 });
 *   }
 * }
 */
/*
Test con Postman:

POST http://localhost:3000/api/chat
Content-Type: application/json

{
  "sessionId": "12345",
  "action": "sendMessage",
  "chatinput": "crear nueva obra en Pueblo Esther"
}
*/
