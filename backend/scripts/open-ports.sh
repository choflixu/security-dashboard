#!/bin/bash
# open-ports.sh - Lista puertos TCP/UDP en escucha con proceso asociado
# Requiere: ss o netstat, lsof

echo "============================================"
echo "   ANALISIS DE PUERTOS ABIERTOS"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

# ---- Puertos TCP en escucha ----
echo ">> PUERTOS TCP EN ESCUCHA:"
echo ""
if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | awk 'NR>1 {printf "  %-8s %-25s %s\n", $1, $4, $6}'
elif command -v netstat &>/dev/null; then
    netstat -tlnp 2>/dev/null | awk 'NR>2 {printf "  %-8s %-25s %s\n", $1, $4, $7}'
else
    echo "  [AVISO] ss/netstat no disponible"
fi

echo ""
echo ">> PUERTOS UDP EN ESCUCHA:"
echo ""
if command -v ss &>/dev/null; then
    ss -ulnp 2>/dev/null | awk 'NR>1 {printf "  %-8s %-25s %s\n", $1, $4, $6}'
fi

echo ""
echo ">> CONEXIONES ESTABLECIDAS (top 10):"
echo ""
if command -v ss &>/dev/null; then
    ss -tnp state established 2>/dev/null | head -11 | awk 'NR>1 {printf "  %-25s -> %-25s %s\n", $4, $5, $6}'
fi

echo ""
echo ">> PUERTOS CRITICOS EN INTERNET:"
CRITICAL_PORTS=(21 22 23 25 110 143 3306 5432 6379 27017)
for port in "${CRITICAL_PORTS[@]}"; do
    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "  [ALERTA] Puerto $port abierto y en escucha"
    fi
done

echo ""
echo "Analisis completado."
exit 0
