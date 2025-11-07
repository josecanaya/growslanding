@echo off
echo 🚀 Iniciando ngrok para GROWS Chat...
echo.

REM Verificar si ngrok está instalado
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ngrok no está instalado. Instalando...
    npm install -g ngrok
    if %errorlevel% neq 0 (
        echo ❌ Error al instalar ngrok
        pause
        exit /b 1
    )
)

echo ✅ ngrok está instalado
echo 🌐 Iniciando túnel ngrok para puerto 5678...
echo.

REM Iniciar ngrok
start "ngrok" ngrok http 5678

echo ⏳ Esperando a que ngrok se inicie...
timeout /t 5 /nobreak >nul

echo.
echo 🎉 ngrok iniciado!
echo 🌐 Interfaz web de ngrok: http://localhost:4040
echo 📡 Webhook URL: https://[tu-url-ngrok].ngrok.io/webhook/Growsbot
echo.
echo 💡 Para obtener la URL exacta, abre: http://localhost:4040
echo 🛑 Para detener ngrok, cierra la ventana de ngrok
echo.
pause
