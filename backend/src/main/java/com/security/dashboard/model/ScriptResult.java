package com.security.dashboard.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Resultado de la ejecucion de un script de seguridad.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScriptResult {

    private String scriptId;
    private String scriptName;

    /** Salida combinada del script (stdout + stderr) */
    private String output;

    /** Codigo de salida del proceso (0 = OK) */
    private int exitCode;

    private ExecutionStatus status;

    /** Duracion en milisegundos */
    private long durationMs;

    private LocalDateTime executedAt;

    /** Mensaje de error si el status es ERROR */
    private String errorMessage;

    public enum ExecutionStatus {
        SUCCESS,   // exitCode == 0
        WARNING,   // exitCode == 1
        ERROR,     // exitCode > 1 o fallo interno
        TIMEOUT,   // el script supero el tiempo limite
        RUNNING    // todavia en ejecucion (usado en streaming)
    }
}
