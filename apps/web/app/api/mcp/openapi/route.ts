import { NextResponse } from 'next/server';
import { mcpCorsHeaders } from '@/lib/mcp-grows/createServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Spec OpenAPI 3 para Custom GPT → Actions. */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Grows Organizar MCP Actions',
      version: '1.1.0',
      description:
        'Acciones en el canvas Organizar de Grows. Solo propuestas (etapa/tarea/precedencia). El humano acepta en el front. No wallet.',
    },
    servers: [{ url: origin }],
    paths: {
      '/api/mcp/actions/listar_obras_vivas': {
        post: {
          operationId: 'listar_obras_vivas',
          summary: 'Listar obras Grows',
          requestBody: {
            required: false,
            content: { 'application/json': { schema: { type: 'object', properties: {} } } },
          },
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/mcp/actions/leer_horizonte': {
        post: {
          operationId: 'leer_horizonte',
          summary: 'Leer etapas/tareas/precedencias',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['obra_id'],
                  properties: { obra_id: { type: 'string' } },
                },
              },
            },
          },
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/mcp/actions/proponer_paso': {
        post: {
          operationId: 'proponer_paso',
          summary: 'Proponer tarea verbo → detalle',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['obra_id', 'mensaje'],
                  properties: {
                    obra_id: { type: 'string' },
                    mensaje: { type: 'string', description: 'Definir programa → Unidades por piso' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/mcp/actions/anotar_hilo': {
        post: {
          operationId: 'anotar_hilo',
          summary: 'Anotar conversación en la obra',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['obra_id', 'user', 'oficio'],
                  properties: {
                    obra_id: { type: 'string' },
                    user: { type: 'string' },
                    oficio: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'OK' } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
    security: [{ bearerAuth: [] }],
  };

  return NextResponse.json(spec, { headers: mcpCorsHeaders });
}
