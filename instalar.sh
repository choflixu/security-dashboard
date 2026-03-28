#!/bin/bash
echo "============================================"
echo "   INSTALANDO SECURITY DASHBOARD"
echo "============================================"
echo ""

# Instala dependencias
echo "[1/4] Instalando Java y Maven..."
sudo apt update -q
sudo apt install -y openjdk-21-jdk maven curl
echo "      OK"

# Descarga el repo
echo "[2/4] Descargando el proyecto..."
cd ~
if [ -d "security-dashboard" ]; then
    echo "      Ya existe, actualizando..."
    cd security-dashboard
    git pull
else
    git clone https://github.com/choflixu/security-dashboard.git
    cd security-dashboard
fi
echo "      OK"

# Copia los scripts
echo "[3/4] Copiando scripts de seguridad..."
sudo mkdir -p /opt/security-scripts
sudo cp scripts/*.sh /opt/security-scripts/
sudo chmod +x /opt/security-scripts/*.sh
echo "      OK"

# Verifica ngrok
echo "[4/4] Verificando ngrok..."
if ! command -v ngrok &>/dev/null; then
    echo "      [AVISO] ngrok no está instalado."
    echo "      Instálalo desde: https://ngrok.com/download"
    echo "      Luego ejecuta: ngrok config add-authtoken TU_TOKEN"
else
    echo "      OK"
fi

echo ""
echo "============================================"
echo "   INSTALACION COMPLETADA"
echo "============================================"
echo ""
echo "  Pasos para arrancar:"
echo "  1. cd ~/security-dashboard"
echo "  2. ./start.sh"
echo "  3. Abre: https://security-dashboard-roan.vercel.app"
echo "  4. Introduce la URL de ngrok en el dashboard"
echo ""
