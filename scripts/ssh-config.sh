#!/bin/bash
# ssh-config.sh - Auditoria de la configuracion de SSH

echo "============================================"
echo "   AUDITORIA DE CONFIGURACION SSH"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

SSHD_CONFIG="/etc/ssh/sshd_config"

if [ ! -f "$SSHD_CONFIG" ]; then
    echo "[AVISO] No se encontro $SSHD_CONFIG. SSH puede no estar instalado."
    exit 1
fi

check_param() {
    local param="$1"
    local expected="$2"
    local value
    value=$(grep -iE "^\s*${param}\s+" "$SSHD_CONFIG" 2>/dev/null | awk '{print $2}' | tail -1)

    if [ -z "$value" ]; then
        echo "  [INFO]    $param no esta definido (valor por defecto)"
    elif [ "${value,,}" = "${expected,,}" ]; then
        echo "  [OK]      $param = $value"
    else
        echo "  [ALERTA]  $param = $value  (recomendado: $expected)"
    fi
}

echo ">> VERIFICACIONES DE SEGURIDAD:"
echo ""

check_param "PermitRootLogin"        "no"
check_param "PasswordAuthentication" "no"
check_param "PermitEmptyPasswords"   "no"
check_param "X11Forwarding"          "no"
check_param "UsePAM"                 "yes"
check_param "MaxAuthTries"           "3"
check_param "LoginGraceTime"         "30"

echo ""
echo ">> PUERTO SSH:"
SSH_PORT=$(grep -iE "^\s*Port\s+" "$SSHD_CONFIG" | awk '{print $2}' | tail -1)
SSH_PORT="${SSH_PORT:-22}"
if [ "$SSH_PORT" = "22" ]; then
    echo "  [AVISO]   Puerto por defecto (22) - considera cambiarlo"
else
    echo "  [OK]      Puerto personalizado: $SSH_PORT"
fi

echo ""
echo ">> CLAVES AUTORIZADAS POR USUARIO:"
getent passwd | awk -F: '($3 >= 1000 || $3 == 0) && $7 !~ /nologin|false/ {print $1, $6}' \
    | while read -r user home; do
        AUTH_KEYS="$home/.ssh/authorized_keys"
        if [ -f "$AUTH_KEYS" ]; then
            KEY_COUNT=$(grep -c "^ssh" "$AUTH_KEYS" 2>/dev/null || echo 0)
            echo "  $user: $KEY_COUNT clave(s) autorizada(s)"
        fi
    done

echo ""
echo ">> ESTADO DEL SERVICIO SSHD:"
if systemctl is-active --quiet sshd 2>/dev/null || systemctl is-active --quiet ssh 2>/dev/null; then
    echo "  [ACTIVO]  El servicio SSH esta corriendo"
else
    echo "  [INACTIVO] El servicio SSH no esta en ejecucion"
fi

echo ""
echo "Auditoria SSH completada."
exit 0
