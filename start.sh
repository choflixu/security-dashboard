#!/bin/bash
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

# Siempre pregunta el token de ngrok
echo "Introduce tu token de ngrok"
echo "(Obtenlo en: https://dashboard.ngrok.com/get-started/your-authtoken)"
echo -n "Token: "
read -r NGROK_TOKEN
if [ -z "$NGROK_TOKEN" ]; then
    echo "[ERROR] Token vacío. Saliendo."
    exit 1
fi
ngrok config add-authtoken "$NGROK_TOKEN"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"

# Mata procesos anteriores en puerto 8080
echo "[0/4] Limpiando procesos anteriores..."
sudo kill -9 $(sudo lsof -t -i:8080) 2>/dev/null
sudo kill -9 $(pgrep ngrok) 2>/dev/null
sleep 2
echo "      OK"

# Copia los scripts de seguridad
echo "[1/4] Copiando scripts de seguridad..."
sudo mkdir -p /opt/security-scripts
sudo cp "$SCRIPTS_DIR"/*.sh /opt/security-scripts/
sudo chmod +x /opt/security-scripts/*.sh
echo "      OK"

# Arranca Spring Boot en background
echo "[2/4] Arrancando Spring Boot..."
cd "$BACKEND_DIR"
mvn spring-boot:run \
    -Dmaven.wagon.timeout=120 \
    -Dmaven.wagon.httpconnectionManager.ttlSeconds=120 \
    > /tmp/springboot.log 2>&1 &
SPRING_PID=$!
echo "      PID: $SPRING_PID"

# Espera a que Spring Boot arranque
echo "[3/4] Esperando a que Spring Boot esté listo..."
for i in {1..150}; do
    if curl -s --max-time 5 http://localhost:8080/api/health 2>/dev/null | grep -q "UP"; then
        echo ""
        echo "      OK - Spring Boot listo"
        break
    fi
    if [ $i -eq 150 ]; then
        echo ""
        echo "      [ERROR] Spring Boot no arrancó. Revisa /tmp/springboot.log"
        kill $SPRING_PID 2>/dev/null
        exit 1
    fi
    sleep 2
    echo -n "."
done

# Arranca ngrok
echo "[4/4] Arrancando ngrok..."
ngrok http 8080 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
sleep 5

# Obtiene la URL de ngrok
NGROK_URL=$(curl -s --max-time 5 http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | grep https | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "      [ERROR] No se pudo obtener la URL de ngrok."
    echo "      Revisa /tmp/ngrok.log"
    cat /tmp/ngrok.log
    kill $SPRING_PID $NGROK_PID 2>/dev/null
    exit 1
fi

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