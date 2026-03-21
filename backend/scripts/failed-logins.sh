#!/bin/bash
# failed-logins.sh - Analiza intentos de acceso fallidos en el sistema

echo "============================================"
echo "   ANALISIS DE INTENTOS DE LOGIN FALLIDOS"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

LOG_FILES=("/var/log/auth.log" "/var/log/secure" "/var/log/messages")
LOG_FILE=""

for f in "${LOG_FILES[@]}"; do
    if [ -r "$f" ]; then
        LOG_FILE="$f"
        break
    fi
done

if [ -z "$LOG_FILE" ]; then
    echo "[AVISO] No se encontro fichero de log de autenticacion legible."
    echo "        Prueba a ejecutar este script con sudo."
    exit 1
fi

echo ">> Fichero analizado: $LOG_FILE"
echo ""

# Total de fallos
TOTAL=$(grep -c "Failed password\|authentication failure\|Invalid user" "$LOG_FILE" 2>/dev/null || echo 0)
echo ">> TOTAL DE INTENTOS FALLIDOS: $TOTAL"
echo ""

# Top 10 IPs atacantes
echo ">> TOP 10 IPs CON MAS INTENTOS:"
grep "Failed password\|Invalid user" "$LOG_FILE" 2>/dev/null \
    | grep -oP '(\d{1,3}\.){3}\d{1,3}' \
    | sort | uniq -c | sort -rn \
    | head -10 \
    | awk '{printf "  %5d intentos  %s\n", $1, $2}'

echo ""

# Ultimos 10 intentos
echo ">> ULTIMOS 10 INTENTOS:"
grep "Failed password\|Invalid user" "$LOG_FILE" 2>/dev/null \
    | tail -10 \
    | awk '{print "  " $0}'

echo ""

# Usuarios objetivo mas frecuentes
echo ">> USUARIOS MAS ATACADOS:"
grep "Failed password\|Invalid user" "$LOG_FILE" 2>/dev/null \
    | grep -oP '(for invalid user|for) \K\S+' \
    | sort | uniq -c | sort -rn \
    | head -5 \
    | awk '{printf "  %5d intentos  usuario: %s\n", $1, $2}'

echo ""

# Intentos en las ultimas 24h
RECENT=$(grep "Failed password\|Invalid user" "$LOG_FILE" 2>/dev/null \
    | awk -v d="$(date --date='24 hours ago' '+%b %e')" '$0 ~ d' | wc -l)
echo ">> INTENTOS EN LAS ULTIMAS 24 HORAS: $RECENT"

echo ""
echo "Analisis completado."
exit 0
