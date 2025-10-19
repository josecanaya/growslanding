# Configuración de ngrok para GROWS Chat
# Este archivo contiene la configuración para exponer n8n webhook

# Comando para iniciar ngrok:
# ngrok http 5678

# Una vez iniciado, ngrok proporcionará una URL pública como:
# https://abc123.ngrok.io -> http://localhost:5678

# Para usar la URL pública en el chat, reemplaza en ChatSection.tsx:
# const webhookUrl = 'https://abc123.ngrok.io/webhook/Growsbot';

# Verificar el estado de ngrok:
# curl http://localhost:4040/api/tunnels

# O abrir la interfaz web de ngrok:
# http://localhost:4040
