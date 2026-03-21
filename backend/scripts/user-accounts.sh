#!/bin/bash
# user-accounts.sh - Auditoria de cuentas de usuario del sistema

echo "============================================"
echo "   AUDITORIA DE CUENTAS DE USUARIO"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

# Usuarios con shell interactiva (UID >= 1000 o root)
echo ">> USUARIOS CON SHELL INTERACTIVA:"
awk -F: '($3 == 0 || $3 >= 1000) && $7 !~ /nologin|false/ {print}' /etc/passwd \
    | awk -F: '{printf "  %-15s UID:%-6s Shell: %s\n", $1, $3, $7}'

echo ""

# Usuarios con UID 0 (equivalentes a root)
echo ">> USUARIOS CON UID 0 (PRIVILEGIO ROOT):"
ROOT_USERS=$(awk -F: '$3 == 0 {print $1}' /etc/passwd)
if [ "$(echo "$ROOT_USERS" | wc -l)" -gt 1 ] || [ "$ROOT_USERS" != "root" ]; then
    echo "  [ALERTA] Usuarios con UID 0 encontrados:"
    echo "$ROOT_USERS" | awk '{print "  - " $0}'
else
    echo "  [OK] Solo root tiene UID 0"
fi

echo ""

# Cuentas sin contrasena
echo ">> CUENTAS SIN CONTRASENA:"
EMPTY_PASS=$(awk -F: '($2 == "" || $2 == "!") && $7 !~ /nologin|false/' /etc/shadow 2>/dev/null | cut -d: -f1)
if [ -n "$EMPTY_PASS" ]; then
    echo "  [ALERTA] Cuentas sin contrasena:"
    echo "$EMPTY_PASS" | awk '{print "  - " $0}'
else
    echo "  [OK] Todas las cuentas tienen contrasena configurada"
fi

echo ""

# Ultima vez que cada usuario inicio sesion
echo ">> ULTIMO LOGIN POR USUARIO:"
if command -v lastlog &>/dev/null; then
    lastlog 2>/dev/null | awk 'NR>1 && !/Never logged in/ {print "  " $0}' | head -20
fi

echo ""

# Usuarios en el grupo sudo/wheel
echo ">> USUARIOS EN GRUPO SUDO/WHEEL:"
for group in sudo wheel admin; do
    MEMBERS=$(getent group "$group" 2>/dev/null | cut -d: -f4)
    if [ -n "$MEMBERS" ]; then
        echo "  Grupo '$group': $MEMBERS"
    fi
done

echo ""

# Sesiones activas
echo ">> SESIONES ACTIVAS AHORA MISMO:"
who 2>/dev/null | awk '{printf "  %-15s desde %s %s\n", $1, $3, $4}' || echo "  (ninguna)"

echo ""
echo "Analisis completado."
exit 0
