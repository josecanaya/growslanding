import { OPERATIONS,limitations } from '@/lib/connectors/operations';
import { resource,SCOPES } from '@/lib/connectors/core';
export async function GET(){return Response.json({version:'1.0',mcp:resource(),operations:OPERATIONS.map(({run,...definition})=>definition),limits:limitations,scopes:SCOPES},{headers:{'Cache-Control':'public, max-age=300'}});}
