#!/bin/bash
# suspicious-processes.sh - Detecta procesos potencialmente sospechosos
echo "============================================"
echo "   ANALISIS DE PROCESOS SOSPECHOSOS"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

echo ">> PROCESOS CORRIENDO COMO ROOT (excl. kernel):"
ps aux 2>/dev/null | awk '$1=="root" && $11 !~ /^\[/ {printf "  PID:%-6s %s\n", $2, $11}' | head -20

echo ""
echo ">> PROCESOS CON MAYOR USO DE CPU (top 10):"
ps aux --sort=-%cpu 2>/dev/null | awk 'NR>1 {printf "  %-10s PID:%-6s CPU:%-6s %s\n", $1, $2, $3, $11}' | head -10

echo ""
echo ">> PROCESOS ESCUCHANDO EN RED:"
if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | awk 'NR>1 {print "  " $0}' | head -20
fi

echo ""
echo ">> PROCESOS CON NOMBRE INUSUAL (posibles shells reversas):"
ps aux 2>/dev/null | grep -E "nc |ncat |netcat |/dev/tcp|/bin/sh -i|bash -i" | grep -v grep | awk '{print "  [ALERTA] " $0}'

echo ""
echo "Analisis completado."
exit 0
