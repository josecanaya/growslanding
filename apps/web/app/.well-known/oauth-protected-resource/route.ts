import { connectorOrigin,resource,SCOPES } from '@/lib/connectors/core';
export async function GET(){return Response.json({resource:resource(),authorization_servers:[connectorOrigin()],scopes_supported:SCOPES,bearer_methods_supported:['header'],resource_name:'GROWS',resource_documentation:connectorOrigin()+'/conexiones'},{headers:{'Access-Control-Allow-Origin':'*'}});}
