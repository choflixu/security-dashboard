#!/bin/bash
# cron-jobs.sh - Inspecciona tareas cron de todos los usuarios
echo "============================================"
echo "   INSPECCION DE TAREAS CRON"
echo "   Fecha: $(date '+%d/%m/%Y %H:%M:%S')"
echo "============================================"
echo ""

echo ">> CRON GLOBAL (/etc/crontab):"
if [ -r /etc/crontab ]; then
    grep -v "^#\|^$" /etc/crontab | awk '{print "  " $0}'
fi

echo ""
echo ">> CRON.D:"
if [ -d /etc/cron.d ]; then
    for f in /etc/cron.d/*; do
        echo "  --- $f ---"
        grep -v "^#\|^$" "$f" 2>/dev/null | awk '{print "  " $0}'
    done
fi

echo ""
echo ">> CRONTABS POR USUARIO:"
for user in $(cut -d: -f1 /etc/passwd); do
    crontab_content=$(crontab -u "$user" -l 2>/dev/null | grep -v "^#\|^$")
    if [ -n "$crontab_content" ]; then
        echo "  Usuario: $user"
        echo "$crontab_content" | awk '{print "    " $0}'
        echo ""
    fi
done

echo ">> SYSTEMD TIMERS (equivalente a cron en sistemas modernos):"
systemctl list-timers --all 2>/dev/null | head -20 | awk '{print "  " $0}'

echo ""
echo "Analisis completado."
exit 0
