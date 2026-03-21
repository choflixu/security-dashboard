package com.security.dashboard.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Representa un script de seguridad registrado en el sistema.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityScript {

    /** Identificador unico del script (nombre del fichero sin extension) */
    private String id;

    /** Nombre legible que se muestra en el dashboard */
    private String name;

    /** Descripcion corta de lo que comprueba */
    private String description;

    /** Nombre del icono (coincide con las claves de icono del frontend) */
    private String icon;

    /** Categoria del script */
    private ScriptCategory category;

    /** Ruta absoluta al fichero .sh en el servidor */
    private String filePath;

    public enum ScriptCategory {
        NETWORK,
        PROCESSES,
        FILESYSTEM,
        USERS,
        UPDATES,
        FIREWALL,
        LOGS
    }
}
