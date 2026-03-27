
# Security Dashboard

Dashboard web para ejecutar scripts de seguridad Bash en tu partición Linux,
con backend Spring Boot (Railway) y frontend React (Vercel).

```
Frontend (Vercel)  ──HTTP/WS──>  Backend Spring Boot (Railway)  ──bash──>  Scripts Linux
```
https://emmalee-nonalternating-unprejudicially.ngrok-free.dev


---

## Estructura del proyecto

```
security-dashboard/
├── backend/                  # Spring Boot (Java 21)
│   ├── src/main/java/com/security/dashboard/
│   │   ├── controller/       # REST API endpoints
│   │   ├── service/          # Lógica de ejecución y registro de scripts
│   │   ├── model/            # Modelos: SecurityScript, ScriptResult
│   │   └── config/           # CORS, WebSocket
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                 # React + Vite (desplegado en Vercel)
│   ├── src/
│   │   ├── App.jsx           # Dashboard principal
│   │   ├── components/
│   │   │   ├── ScriptCard.jsx    # Tarjeta de script con icono
│   │   │   ├── TerminalPanel.jsx # Terminal de output en tiempo real
│   │   │   └── ScriptIcon.jsx    # Iconos SVG
│   │   └── services/api.js   # Cliente REST + WebSocket
│   └── vercel.json
│
├── scripts/                  # Scripts Bash de seguridad
│   ├── open-ports.sh
│   ├── failed-logins.sh
│   ├── suid-files.sh
│   ├── user-accounts.sh
│   ├── ssh-config.sh
│   └── ... (añade los tuyos)
│
└── railway.toml
```

---

##  Despliegue paso a paso

### 1. Backend en Railway

1. Crea cuenta en [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. Selecciona este repositorio
4. Railway detectará el `Dockerfile` en `/backend`
5. Añade estas **variables de entorno** en Railway:

   | Variable         | Valor                                      |
   |------------------|--------------------------------------------|
   | `PORT`           | `8080`                                     |
   | `CORS_ORIGINS`   | `https://TU-APP.vercel.app,http://localhost:5173` |
   | `SCRIPTS_DIR`    | `/opt/security-scripts`                    |
   | `SCRIPTS_TIMEOUT`| `60`                                       |

6. Railway te dará una URL tipo `https://security-dashboard-backend.railway.app`

> **Nota importante:** Railway corre en contenedores Linux, por lo que los
> scripts se ejecutarán en el servidor Railway, no en tu máquina local.
> Para ejecutarlos en tu partición Linux local, usa el modo de desarrollo
> con el backend corriendo en tu máquina (ver sección desarrollo local).

---

### 2. Frontend en Vercel

1. Crea cuenta en [vercel.com](https://vercel.com)
2. **New Project → Import Git Repository**
3. Selecciona este repo, establece **Root Directory** → `frontend`
4. Añade la variable de entorno:

   | Variable       | Valor                                          |
   |----------------|------------------------------------------------|
   | `VITE_API_URL` | `https://TU-BACKEND.railway.app`               |

5. Click **Deploy** → Vercel construye con `npm run build`

---

##  Desarrollo local (scripts en tu Linux)

```bash
# Terminal 1: Backend Spring Boot
cd backend
./mvnw spring-boot:run

# Terminal 2: Frontend Vite
cd frontend
npm install
npm run dev
```

El `vite.config.js` ya tiene un proxy configurado hacia `localhost:8080`,
así que el frontend se conectará automáticamente a tu backend local,
que a su vez ejecutará los scripts en **tu partición Linux**.

Variables para desarrollo local (crea `backend/src/main/resources/application-local.properties`):
```properties
app.scripts.directory=/ruta/absoluta/a/scripts
```

---

##  Añadir nuevos scripts

1. Crea un fichero `.sh` en la carpeta `/scripts/`
2. Opcionalmente, regístralo con metadatos en `ScriptRegistryService.java`
3. Si no lo registras, será **autodescubierto** con icono genérico de terminal

El script recibirá:
- Variable de entorno `LANG=es_ES.UTF-8`
- stdout y stderr combinados → enviados al terminal del frontend
- Código de salida: `0` = SUCCESS · `1` = WARNING · `>1` = ERROR

---

##  API REST

| Método | Endpoint                     | Descripción                          |
|--------|------------------------------|--------------------------------------|
| GET    | `/api/scripts`               | Lista todos los scripts              |
| GET    | `/api/scripts/{id}`          | Detalle de un script                 |
| POST   | `/api/scripts/{id}/run`      | Ejecuta el script (responde 202)     |
| GET    | `/api/scripts/{id}/result`   | Último resultado                     |
| GET    | `/api/health`                | Health check                         |

##  WebSocket (STOMP)

Endpoint: `wss://TU-BACKEND.railway.app/ws`  
Topic de suscripción: `/topic/script-output/{scriptId}`

Cada mensaje es un JSON `ScriptResult` con campo `status`:
- `RUNNING` → output parcial (se concatena en el terminal)
- `SUCCESS / WARNING / ERROR / TIMEOUT` → resultado final
