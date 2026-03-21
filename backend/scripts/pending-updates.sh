#!/bin/bash
# pending-updates.sh - Comprueba actualizaciones de seguridad pendientes
echo "============================================"
echo "   ACTUALIZACIONES DE SEGURIDAD PENDIENTES"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

if command -v apt &>/dev/null; then
    echo ">> SISTEMA: Debian/Ubuntu (apt)"
    apt list --upgradable 2>/dev/null | grep -v "Listing..." | head -30 | awk '{print "  " $0}'
    echo ""
    SECURITY=$(apt list --upgradable 2>/dev/null | grep -i security | wc -l)
    echo "  Actualizaciones de seguridad pendientes: $SECURITY"
elif command -v dnf &>/dev/null; then
    echo ">> SISTEMA: Fedora/RHEL (dnf)"
    dnf check-update --security 2>/dev/null | head -30 | awk '{print "  " $0}'
elif command -v pacman &>/dev/null; then
    echo ">> SISTEMA: Arch Linux (pacman)"
    pacman -Qu 2>/dev/null | head -30 | awk '{print "  " $0}'
else
    echo "  [AVISO] Gestor de paquetes no reconocido"
fi

echo ""
echo "Analisis completado."
exit 0
