Aquí tienes el texto reescrito sin las líneas divisorias, más limpio y fluido:

---

# Security Dashboard

Dashboard web para ejecutar scripts de seguridad Bash en tu máquina Linux, con backend en Spring Boot y frontend en React desplegado en Vercel.

Tu máquina Linux ──ngrok──> Internet ──> Frontend (Vercel)

URL del dashboard: [https://security-dashboard-roan.vercel.app](https://security-dashboard-roan.vercel.app)

## ¿Cómo funciona?

Cada persona ejecuta el backend en su propia máquina Linux. Los scripts se ejecutan localmente y los resultados se muestran en el dashboard. Cada dispositivo mantiene su propia caché de resultados.

## Requisitos

* Linux (nativo, WSL o máquina virtual)
* Cuenta gratuita en [https://ngrok.com](https://ngrok.com)
* Conexión a internet

## Instalación (una sola vez)

Abre una terminal Linux y ejecuta:

```
curl -o instalar.sh https://raw.githubusercontent.com/choflixu/security-dashboard/master/instalar.sh && bash instalar.sh
```

Esto instalará automáticamente:

* Java 21
* Maven
* El proyecto completo

## Instalar ngrok

1. Crea una cuenta gratuita en [https://ngrok.com](https://ngrok.com)
2. Descarga ngrok para Linux desde [https://ngrok.com/download](https://ngrok.com/download)
3. Extrae y muévelo a /usr/local/bin:

```
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/ngrok
```

4. Copia tu authtoken desde [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)

## Uso diario

Cada vez que quieras usar el dashboard ejecuta:

```
cd ~/security-dashboard
./start.sh
```

El script te pedirá tu token de ngrok y arrancará todo automáticamente. Al final verás algo así:

```
============================================
   DASHBOARD LISTO
============================================

  URL Backend:   https://abc123.ngrok-free.app
  URL Dashboard: https://security-dashboard-roan.vercel.app

  Pasos:
  1. Abre el dashboard en el navegador
  2. Pulsa 'cambiar backend'
  3. Introduce esta URL: https://abc123.ngrok-free.app
  4. Pulsa Conectar
============================================
```

Para parar todo pulsa Ctrl + C.

## Uso en Windows (WSL)

Si usas Windows, primero instala WSL abriendo PowerShell como administrador y ejecutando:

```
wsl --install
```

Reinicia el PC y luego sigue los pasos de instalación desde la terminal WSL.

## Uso simultáneo en varias máquinas

Cada máquina necesita:

* Su propia instalación del proyecto
* Su propia cuenta de ngrok (la versión gratuita solo permite una sesión activa)

Cada persona debe abrir el dashboard, pulsar "cambiar backend" e introducir su propia URL de ngrok.

## Scripts de seguridad incluidos

* Puertos abiertos: lista puertos TCP/UDP en escucha
* Reglas de firewall: estado de iptables/nftables
* Procesos sospechosos: detecta comportamientos anómalos
* Login fallidos: analiza /var/log/auth.log
* Ficheros SUID/SGID: busca vectores de escalada de privilegios
* Cuentas de usuario: auditoría del sistema
* Actualizaciones: paquetes desactualizados
* Detección de rootkits: ejecuta chkrootkit y rkhunter
* Tareas cron: inspecciona crontabs en busca de entradas maliciosas
* Configuración SSH: auditoría de sshd_config

## Añadir nuevos scripts

1. Crea un fichero `.sh` en la carpeta `scripts/`
2. Cópialo a `/opt/security-scripts/`:

```
sudo cp scripts/mi-script.sh /opt/security-scripts/
sudo chmod +x /opt/security-scripts/mi-script.sh
```

3. Opcionalmente, regístralo con metadatos en `ScriptRegistryService.java`

## Estructura del proyecto

```
security-dashboard/
├── backend/                  Spring Boot (Java 21)
│   ├── src/main/java/com/security/dashboard/
│   │   ├── controller/       REST API endpoints
│   │   ├── service/          Lógica de ejecución de scripts
│   │   ├── model/            Modelos de datos
│   │   └── config/           CORS y WebSocket
│   └── pom.xml
│
├── frontend/                 React + Vite (Vercel)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── services/api.js
│   └── vercel.json
│
├── scripts/                  Scripts Bash de seguridad
├── instalar.sh               Script de instalación automática
└── start.sh                  Script de arranque
```

## API REST

```
GET   /api/scripts              Lista todos los scripts
POST  /api/scripts/{id}/run     Ejecuta un script
GET   /api/scripts/{id}/result  Último resultado
GET   /api/health               Health check
```
