#!/bin/bash
# rootkits.sh - Deteccion basica de rootkits
echo "============================================"
echo "   DETECCION DE ROOTKITS"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

if command -v rkhunter &>/dev/null; then
    echo ">> RKHUNTER:"
    rkhunter --check --skip-keypress --quiet 2>/dev/null | grep -E "Warning|Infected|Found|OK" | head -30 | awk '{print "  " $0}'
else
    echo "  [INFO] rkhunter no instalado. Instala con: sudo apt install rkhunter"
fi

echo ""

if command -v chkrootkit &>/dev/null; then
    echo ">> CHKROOTKIT:"
    chkrootkit 2>/dev/null | grep -v "not found" | grep -v "not infected" | head -20 | awk '{print "  " $0}'
else
    echo "  [INFO] chkrootkit no instalado. Instala con: sudo apt install chkrootkit"
fi

echo ""
echo ">> MODULOS DE KERNEL NO FIRMADOS:"
if command -v modinfo &>/dev/null; then
    lsmod 2>/dev/null | awk 'NR>1 {print $1}' | while read mod; do
        sig=$(modinfo "$mod" 2>/dev/null | grep "^sig" | head -1)
        if [ -z "$sig" ]; then
            echo "  [REVISAR] Modulo sin firma: $mod"
        fi
    done | head -10
fi

echo ""
echo "Analisis completado."
exit 0
