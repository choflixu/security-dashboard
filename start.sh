#!/bin/bash
# start.sh - Arranca el Security Dashboard completo

echo "============================================"
echo "   SECURITY DASHBOARD - INICIO"
echo "============================================"
echo ""

# Verifica Java
if ! command -v java &>/dev/null; then
    echo "[ERROR] Java no está instalado."
    echo "        Instala con: sudo apt install openjdk-21-jdk"
    exit 1
fi

# Verifica Maven
if ! command -v mvn &>/dev/null; then
    echo "[ERROR] Maven no está instalado."
    echo "        Instala con: sudo apt install maven"
    exit 1
fi

# Verifica ngrok
if ! command -v ngrok &>/dev/null; then
    echo "[ERROR] ngrok no está instalado."
    echo "        Instala desde: https://ngrok.com/download"
    exit 1
fi

# Verifica que ngrok tiene token
if ! ngrok config check &>/dev/null; then
    echo "[ERROR] ngrok no tiene authtoken configurado."
    echo "        Ejecuta: ngrok config add-authtoken TU_TOKEN"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"

# Copia los scripts de seguridad
echo "[1/4] Copiando scripts de seguridad..."
sudo mkdir -p /opt/security-scripts
sudo cp "$SCRIPTS_DIR"/*.sh /opt/security-scripts/
sudo chmod +x /opt/security-scripts/*.sh
echo "      OK"

# Arranca Spring Boot en background
echo "[2/4] Arrancando Spring Boot..."
cd "$BACKEND_DIR"
mvn spring-boot:run > /tmp/springboot.log 2>&1 &
SPRING_PID=$!
echo "      PID: $SPRING_PID"

# Espera a que Spring Boot arranque
echo "[3/4] Esperando a que Spring Boot esté listo..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health | grep -q "UP"; then
        echo "      OK - Spring Boot listo"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "      [ERROR] Spring Boot no arrancó. Revisa /tmp/springboot.log"
        kill $SPRING_PID 2>/dev/null
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo ""

# Arranca ngrok
echo "[4/4] Arrancando ngrok..."
ngrok http 8080 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
sleep 3

# Obtiene la URL de ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | grep https | cut -d'"' -f4)

echo ""
echo "============================================"
echo "   DASHBOARD LISTO"
echo "============================================"
echo ""
echo "  URL Backend:   $NGROK_URL"
echo "  URL Dashboard: https://security-dashboard-roan.vercel.app"
echo ""
echo "  Pasos:"
echo "  1. Abre el dashboard en el navegador"
echo "  2. Pulsa 'cambiar backend'"
echo "  3. Introduce esta URL: $NGROK_URL"
echo "  4. Pulsa Conectar"
echo ""
echo "  Para parar todo: Ctrl+C"
echo "============================================"

# Espera y limpia al salir
trap "echo 'Parando...'; kill $SPRING_PID $NGROK_PID 2>/dev/null; exit" INT TERM
wait
