#!/bin/bash
# open-ports.sh - Lista puertos TCP/UDP en escucha con proceso asociado

echo "============================================"
echo "   ANALISIS DE PUERTOS ABIERTOS"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

echo ">> INFORMACION DEL SISTEMA:"
echo ""
echo "  Hostname:     $(hostname)"
echo "  Usuario:      $(whoami)"
echo "  Sistema:      $(uname -a)"
echo "  OS:           $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
echo ""

echo ">> INFORMACION DE RED:"
echo ""
echo "  Interfaces de red:"
ip addr show 2>/dev/null | grep -E 'inet |^[0-9]+:' | awk '
  /^[0-9]+:/ { iface=$2 }
  /inet / { printf "    %-12s %s\n", iface, $2 }
' | grep -v '127.0.0.1'
echo ""
echo -n "  IP publica:   "
curl -s --max-time 5 https://api.ipify.org 2>/dev/null || \
curl -s --max-time 5 https://ifconfig.me 2>/dev/null || \
echo "no disponible"
echo ""
echo ""

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