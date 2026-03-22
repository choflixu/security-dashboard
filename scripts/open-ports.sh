echo ">> INFORMACION DEL SISTEMA:"
echo ""
echo "  Hostname:     $(hostname)"
echo "  Usuario:      $(whoami)"
echo "  Sistema:      $(uname -a)"
echo "  OS:           $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
echo ""

echo ">> INFORMACION DE RED:"
echo ""

# Todas las interfaces de red
echo "  Interfaces de red:"
ip addr show 2>/dev/null | grep -E 'inet |^[0-9]+:' | awk '
  /^[0-9]+:/ { iface=$2 }
  /inet / { printf "    %-12s %s\n", iface, $2 }
' | grep -v '127.0.0.1'

echo ""

# IP publica
echo -n "  IP publica:   "
curl -s --max-time 5 https://api.ipify.org 2>/dev/null || \
curl -s --max-time 5 https://ifconfig.me 2>/dev/null || \
echo "no disponible"
echo ""
echo ""