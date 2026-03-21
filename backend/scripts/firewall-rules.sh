#!/bin/bash
# firewall-rules.sh - Estado y reglas del firewall
echo "============================================"
echo "   AUDITORIA DE FIREWALL"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

if command -v nft &>/dev/null; then
    echo ">> NFTABLES - REGLAS ACTIVAS:"
    nft list ruleset 2>/dev/null || echo "  (sin reglas o sin permisos)"
elif command -v iptables &>/dev/null; then
    echo ">> IPTABLES - CADENA INPUT:"
    iptables -L INPUT -n -v 2>/dev/null || echo "  (requiere sudo)"
    echo ""
    echo ">> IPTABLES - CADENA OUTPUT:"
    iptables -L OUTPUT -n -v 2>/dev/null || echo "  (requiere sudo)"
else
    echo "  [AVISO] No se encontro iptables ni nftables"
fi

echo ""
if command -v ufw &>/dev/null; then
    echo ">> ESTADO UFW:"
    ufw status verbose 2>/dev/null || echo "  (requiere sudo)"
fi
echo ""
echo "Auditoria completada."
exit 0
