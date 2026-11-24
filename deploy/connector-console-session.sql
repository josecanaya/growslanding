alter table public.connector_grants add column channel text not null default 'external'
 check (channel in ('external','web_console'));
comment on column public.connector_grants.channel is 'Las autorizaciones web_console solo funcionan con la sesión web verificada del mismo usuario; no son credenciales para conectores externos.';
