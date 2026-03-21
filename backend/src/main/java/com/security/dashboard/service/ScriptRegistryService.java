package com.security.dashboard.service;

import com.security.dashboard.model.SecurityScript;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.*;

/**
 * Mantiene el catalogo de scripts de seguridad disponibles.
 *
 * Los scripts se descubren automaticamente del directorio configurado
 * en app.scripts.directory. Ademas se pre-registran los scripts
 * incluidos en el proyecto con sus metadatos.
 */
@Service
public class ScriptRegistryService {

    private static final Logger log = LoggerFactory.getLogger(ScriptRegistryService.class);

    @Value("${app.scripts.directory}")
    private String scriptsDirectory;

    // Mapa id -> script
    private final Map<String, SecurityScript> registry = new LinkedHashMap<>();

    @PostConstruct
    public void loadScripts() {
        // Scripts pre-registrados con metadatos ricos
        List<SecurityScript> predefined = buildPredefinedScripts();
        predefined.forEach(s -> registry.put(s.getId(), s));

        // Descubrimiento automatico de .sh adicionales en el directorio
        File dir = new File(scriptsDirectory);
        if (dir.exists() && dir.isDirectory()) {
            File[] shFiles = dir.listFiles(f -> f.getName().endsWith(".sh"));
            if (shFiles != null) {
                for (File f : shFiles) {
                    String id = f.getName().replace(".sh", "");
                    // Solo registrar si no existe ya
                    if (!registry.containsKey(id)) {
                        registry.put(id, SecurityScript.builder()
                                .id(id)
                                .name(humanize(id))
                                .description("Script personalizado: " + f.getName())
                                .icon("terminal")
                                .category(SecurityScript.ScriptCategory.FILESYSTEM)
                                .filePath(f.getAbsolutePath())
                                .build());
                        log.info("Script descubierto automaticamente: {}", f.getName());
                    }
                }
            }
        } else {
            log.warn("Directorio de scripts no encontrado: {}. Usando solo scripts predefinidos.", scriptsDirectory);
        }

        log.info("Catalogo de scripts cargado: {} scripts registrados", registry.size());
    }

    public Collection<SecurityScript> getAllScripts() {
        return Collections.unmodifiableCollection(registry.values());
    }

    public Optional<SecurityScript> findById(String id) {
        return Optional.ofNullable(registry.get(id));
    }

    // -------------------------------------------------------------------------
    // Scripts predefinidos con metadatos completos
    // -------------------------------------------------------------------------

    private List<SecurityScript> buildPredefinedScripts() {
        String base = scriptsDirectory + "/";
        return List.of(

            SecurityScript.builder()
                .id("open-ports")
                .name("Puertos Abiertos")
                .description("Lista todos los puertos TCP/UDP en escucha y los procesos asociados")
                .icon("network")
                .category(SecurityScript.ScriptCategory.NETWORK)
                .filePath(base + "open-ports.sh")
                .build(),

            SecurityScript.builder()
                .id("firewall-rules")
                .name("Reglas de Firewall")
                .description("Muestra el estado de iptables / nftables y las reglas activas")
                .icon("shield")
                .category(SecurityScript.ScriptCategory.FIREWALL)
                .filePath(base + "firewall-rules.sh")
                .build(),

            SecurityScript.builder()
                .id("suspicious-processes")
                .name("Procesos Sospechosos")
                .description("Detecta procesos con privilegios elevados o comportamiento anomalo")
                .icon("cpu")
                .category(SecurityScript.ScriptCategory.PROCESSES)
                .filePath(base + "suspicious-processes.sh")
                .build(),

            SecurityScript.builder()
                .id("failed-logins")
                .name("Intentos de Login Fallidos")
                .description("Analiza /var/log/auth.log en busca de intentos de acceso fallidos")
                .icon("lock")
                .category(SecurityScript.ScriptCategory.LOGS)
                .filePath(base + "failed-logins.sh")
                .build(),

            SecurityScript.builder()
                .id("suid-files")
                .name("Ficheros SUID/SGID")
                .description("Busca ficheros con bits SUID o SGID que pueden ser vectores de escalada")
                .icon("file-warning")
                .category(SecurityScript.ScriptCategory.FILESYSTEM)
                .filePath(base + "suid-files.sh")
                .build(),

            SecurityScript.builder()
                .id("user-accounts")
                .name("Cuentas de Usuario")
                .description("Lista usuarios del sistema, ultima sesion y cuentas sin contrasena")
                .icon("users")
                .category(SecurityScript.ScriptCategory.USERS)
                .filePath(base + "user-accounts.sh")
                .build(),

            SecurityScript.builder()
                .id("pending-updates")
                .name("Actualizaciones Pendientes")
                .description("Comprueba paquetes desactualizados con CVEs conocidos")
                .icon("refresh")
                .category(SecurityScript.ScriptCategory.UPDATES)
                .filePath(base + "pending-updates.sh")
                .build(),

            SecurityScript.builder()
                .id("rootkits")
                .name("Deteccion Rootkits")
                .description("Ejecuta chkrootkit y rkhunter para detectar rootkits conocidos")
                .icon("bug")
                .category(SecurityScript.ScriptCategory.FILESYSTEM)
                .filePath(base + "rootkits.sh")
                .build(),

            SecurityScript.builder()
                .id("cron-jobs")
                .name("Tareas Cron")
                .description("Inspecciona crontabs de todos los usuarios buscando entradas maliciosas")
                .icon("clock")
                .category(SecurityScript.ScriptCategory.PROCESSES)
                .filePath(base + "cron-jobs.sh")
                .build(),

            SecurityScript.builder()
                .id("ssh-config")
                .name("Configuracion SSH")
                .description("Audita sshd_config: root login, autenticacion por clave, puerto, etc.")
                .icon("key")
                .category(SecurityScript.ScriptCategory.NETWORK)
                .filePath(base + "ssh-config.sh")
                .build()
        );
    }

    private String humanize(String id) {
        return Arrays.stream(id.split("[-_]"))
                .map(w -> Character.toUpperCase(w.charAt(0)) + w.substring(1))
                .reduce((a, b) -> a + " " + b)
                .orElse(id);
    }
}
