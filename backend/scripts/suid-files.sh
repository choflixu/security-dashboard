#!/bin/bash
# suid-files.sh - Busca ficheros con bits SUID/SGID

echo "============================================"
echo "   BUSQUEDA DE FICHEROS SUID / SGID"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

# Lista blanca de SUID/SGID esperados en un sistema normal
WHITELIST=(
    "/usr/bin/sudo"
    "/usr/bin/su"
    "/usr/bin/passwd"
    "/usr/bin/newgrp"
    "/usr/bin/chsh"
    "/usr/bin/chfn"
    "/usr/bin/gpasswd"
    "/usr/bin/pkexec"
    "/usr/lib/openssh/ssh-keysign"
    "/usr/lib/dbus-1.0/dbus-daemon-launch-helper"
    "/bin/ping"
    "/bin/mount"
    "/bin/umount"
)

echo ">> FICHEROS SUID ENCONTRADOS:"
echo ""

SUID_FILES=$(find / -perm -4000 -type f 2>/dev/null)
SUID_COUNT=$(echo "$SUID_FILES" | grep -c . || echo 0)
echo "   Total encontrados: $SUID_COUNT"
echo ""

while IFS= read -r file; do
    OWNER=$(stat -c '%U' "$file" 2>/dev/null)
    PERMS=$(stat -c '%A' "$file" 2>/dev/null)

    # Comprobar si esta en la lista blanca
    IS_KNOWN=false
    for known in "${WHITELIST[@]}"; do
        if [ "$file" = "$known" ]; then
            IS_KNOWN=true
            break
        fi
    done

    if $IS_KNOWN; then
        echo "  [OK]      $perms  $OWNER  $file"
    else
        echo "  [REVISAR] $PERMS  $OWNER  $file"
    fi
done <<< "$SUID_FILES"

echo ""
echo ">> FICHEROS SGID ENCONTRADOS:"
echo ""

SGID_FILES=$(find / -perm -2000 -type f 2>/dev/null)
SGID_COUNT=$(echo "$SGID_FILES" | grep -c . || echo 0)
echo "   Total encontrados: $SGID_COUNT"
echo ""

while IFS= read -r file; do
    PERMS=$(stat -c '%A' "$file" 2>/dev/null)
    GROUP=$(stat -c '%G' "$file" 2>/dev/null)
    echo "  $PERMS  $GROUP  $file"
done <<< "$SGID_FILES"

echo ""
echo ">> RECOMENDACION:"
echo "   Revisa los ficheros marcados con [REVISAR]."
echo "   Si no reconoces el fichero, investiga su origen."
echo ""
echo "Analisis completado."
exit 0
