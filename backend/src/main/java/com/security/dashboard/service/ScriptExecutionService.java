package com.security.dashboard.service;

import com.security.dashboard.model.ScriptResult;
import com.security.dashboard.model.SecurityScript;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.*;

/**
 * Servicio responsable de ejecutar scripts Bash de forma asincrona
 * y enviar la salida linea a linea via WebSocket al frontend.
 */
@Service
public class ScriptExecutionService {

    private static final Logger log = LoggerFactory.getLogger(ScriptExecutionService.class);

    private final ScriptRegistryService registry;
    private final SimpMessagingTemplate messaging;

    @Value("${app.scripts.timeout}")
    private int timeoutSeconds;

    // Pool dedicado a ejecucion de scripts (max 4 en paralelo)
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    // Cache de los ultimos resultados por scriptId
    private final Map<String, ScriptResult> lastResults = new ConcurrentHashMap<>();

    public ScriptExecutionService(ScriptRegistryService registry,
                                   SimpMessagingTemplate messaging) {
        this.registry = registry;
        this.messaging = messaging;
    }

    /**
     * Lanza la ejecucion de un script en background y devuelve inmediatamente
     * un resultado con estado RUNNING. La salida se emite via WebSocket.
     *
     * @param scriptId id del script a ejecutar
     * @return CompletableFuture con el resultado final
     */
    public CompletableFuture<ScriptResult> executeAsync(String scriptId) {
        SecurityScript script = registry.findById(scriptId)
                .orElseThrow(() -> new IllegalArgumentException("Script no encontrado: " + scriptId));

        log.info("Iniciando ejecucion del script: {}", scriptId);

        return CompletableFuture.supplyAsync(() -> runScript(script), executor);
    }

    /**
     * Devuelve el ultimo resultado conocido de un script, o null si nunca se ha ejecutado.
     */
    public ScriptResult getLastResult(String scriptId) {
        return lastResults.get(scriptId);
    }

    // -------------------------------------------------------------------------
    // Ejecucion interna
    // -------------------------------------------------------------------------

    private ScriptResult runScript(SecurityScript script) {
        long startMs = System.currentTimeMillis();
        StringBuilder outputBuffer = new StringBuilder();
        String topic = "/topic/script-output/" + script.getId();

        // Notificar al frontend que el script esta arrancando
        broadcast(topic, ScriptResult.builder()
                .scriptId(script.getId())
                .scriptName(script.getName())
                .status(ScriptResult.ExecutionStatus.RUNNING)
                .output("[Iniciando " + script.getName() + "...]\n")
                .executedAt(LocalDateTime.now())
                .build());

        File scriptFile = new File(script.getFilePath());
        if (!scriptFile.exists()) {
            return handleError(script, topic, startMs,
                    "Fichero de script no encontrado: " + script.getFilePath());
        }

        if (!scriptFile.canExecute()) {
            // Intentar dar permisos de ejecucion automaticamente
            boolean ok = scriptFile.setExecutable(true);
            if (!ok) {
                return handleError(script, topic, startMs,
                        "El script no tiene permisos de ejecucion: " + script.getFilePath());
            }
        }

        try {
            ProcessBuilder pb = new ProcessBuilder("bash", script.getFilePath());
            pb.redirectErrorStream(true);   // stderr -> stdout
            pb.environment().put("LANG", "es_ES.UTF-8");

            Process process = pb.start();

            // Leer la salida linea a linea en un hilo separado
            Future<?> readerFuture = executor.submit(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        String lineWithNewline = line + "\n";
                        outputBuffer.append(lineWithNewline);

                        // Emitir cada linea al frontend en tiempo real
                        broadcast(topic, ScriptResult.builder()
                                .scriptId(script.getId())
                                .scriptName(script.getName())
                                .status(ScriptResult.ExecutionStatus.RUNNING)
                                .output(lineWithNewline)
                                .build());
                    }
                } catch (IOException e) {
                    log.error("Error leyendo output del script {}: {}", script.getId(), e.getMessage());
                }
            });

            // Esperar al proceso con timeout
            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                readerFuture.cancel(true);
                return handleTimeout(script, topic, startMs, outputBuffer.toString());
            }

            // Asegurarse de que el reader termina
            try {
                readerFuture.get(5, TimeUnit.SECONDS);
            } catch (Exception ignored) { }

            int exitCode = process.exitValue();
            long durationMs = System.currentTimeMillis() - startMs;

            ScriptResult.ExecutionStatus status = switch (exitCode) {
                case 0 -> ScriptResult.ExecutionStatus.SUCCESS;
                case 1 -> ScriptResult.ExecutionStatus.WARNING;
                default -> ScriptResult.ExecutionStatus.ERROR;
            };

            ScriptResult result = ScriptResult.builder()
                    .scriptId(script.getId())
                    .scriptName(script.getName())
                    .output(outputBuffer.toString())
                    .exitCode(exitCode)
                    .status(status)
                    .durationMs(durationMs)
                    .executedAt(LocalDateTime.now())
                    .build();

            lastResults.put(script.getId(), result);

            // Notificar resultado final
            broadcast(topic, result);

            log.info("Script {} finalizado. Estado: {}, duracion: {}ms", script.getId(), status, durationMs);
            return result;

        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return handleError(script, topic, startMs, e.getMessage());
        }
    }

    private ScriptResult handleError(SecurityScript script, String topic,
                                      long startMs, String errorMsg) {
        log.error("Error ejecutando script {}: {}", script.getId(), errorMsg);
        ScriptResult result = ScriptResult.builder()
                .scriptId(script.getId())
                .scriptName(script.getName())
                .output("[ERROR] " + errorMsg + "\n")
                .exitCode(-1)
                .status(ScriptResult.ExecutionStatus.ERROR)
                .durationMs(System.currentTimeMillis() - startMs)
                .executedAt(LocalDateTime.now())
                .errorMessage(errorMsg)
                .build();
        lastResults.put(script.getId(), result);
        broadcast(topic, result);
        return result;
    }

    private ScriptResult handleTimeout(SecurityScript script, String topic,
                                        long startMs, String partialOutput) {
        log.warn("Script {} supero el timeout de {}s", script.getId(), timeoutSeconds);
        ScriptResult result = ScriptResult.builder()
                .scriptId(script.getId())
                .scriptName(script.getName())
                .output(partialOutput + "\n[TIMEOUT] El script supero el limite de " + timeoutSeconds + " segundos\n")
                .exitCode(-2)
                .status(ScriptResult.ExecutionStatus.TIMEOUT)
                .durationMs(System.currentTimeMillis() - startMs)
                .executedAt(LocalDateTime.now())
                .errorMessage("Timeout despues de " + timeoutSeconds + "s")
                .build();
        lastResults.put(script.getId(), result);
        broadcast(topic, result);
        return result;
    }

    private void broadcast(String topic, ScriptResult payload) {
        try {
            messaging.convertAndSend(topic, payload);
        } catch (Exception e) {
            log.debug("No se pudo enviar mensaje WebSocket al topic {}: {}", topic, e.getMessage());
        }
    }
}
