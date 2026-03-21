package com.security.dashboard.service;

import com.security.dashboard.model.ScriptResult;
import com.security.dashboard.model.SecurityScript;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDateTime;
import java.util.concurrent.*;

@Service
public class ScriptExecutionService {

    private static final Logger log = LoggerFactory.getLogger(ScriptExecutionService.class);

    private final ScriptRegistryService registry;

    @Value("${app.scripts.timeout}")
    private int timeoutSeconds;

    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    public ScriptExecutionService(ScriptRegistryService registry) {
        this.registry = registry;
    }

    public CompletableFuture<ScriptResult> executeAsync(String scriptId) {
        SecurityScript script = registry.findById(scriptId)
                .orElseThrow(() -> new IllegalArgumentException("Script no encontrado: " + scriptId));

        log.info("Iniciando ejecucion del script: {}", scriptId);
        return CompletableFuture.supplyAsync(() -> runScript(script), executor);
    }

    private ScriptResult runScript(SecurityScript script) {
        long startMs = System.currentTimeMillis();
        StringBuilder outputBuffer = new StringBuilder();

        File scriptFile = new File(script.getFilePath());
        if (!scriptFile.exists()) {
            return buildError(script, startMs, "Fichero de script no encontrado: " + script.getFilePath());
        }

        if (!scriptFile.canExecute()) {
            boolean ok = scriptFile.setExecutable(true);
            if (!ok) {
                return buildError(script, startMs, "El script no tiene permisos de ejecucion: " + script.getFilePath());
            }
        }

        try {
            ProcessBuilder pb = new ProcessBuilder("bash", script.getFilePath());
            pb.redirectErrorStream(true);
            pb.environment().put("LANG", "es_ES.UTF-8");

            Process process = pb.start();

            Future<?> readerFuture = executor.submit(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        outputBuffer.append(line).append("\n");
                    }
                } catch (IOException e) {
                    log.error("Error leyendo output del script {}: {}", script.getId(), e.getMessage());
                }
            });

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                readerFuture.cancel(true);
                return ScriptResult.builder()
                        .scriptId(script.getId())
                        .scriptName(script.getName())
                        .output(outputBuffer + "\n[TIMEOUT] El script supero el limite de " + timeoutSeconds + " segundos\n")
                        .exitCode(-2)
                        .status(ScriptResult.ExecutionStatus.TIMEOUT)
                        .durationMs(System.currentTimeMillis() - startMs)
                        .executedAt(LocalDateTime.now())
                        .build();
            }

            try { readerFuture.get(5, TimeUnit.SECONDS); } catch (Exception ignored) {}

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

            log.info("Script {} finalizado. Estado: {}, duracion: {}ms", script.getId(), status, durationMs);
            return result;

        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return buildError(script, startMs, e.getMessage());
        }
    }

    private ScriptResult buildError(SecurityScript script, long startMs, String errorMsg) {
        log.error("Error ejecutando script {}: {}", script.getId(), errorMsg);
        return ScriptResult.builder()
                .scriptId(script.getId())
                .scriptName(script.getName())
                .output("[ERROR] " + errorMsg + "\n")
                .exitCode(-1)
                .status(ScriptResult.ExecutionStatus.ERROR)
                .durationMs(System.currentTimeMillis() - startMs)
                .executedAt(LocalDateTime.now())
                .errorMessage(errorMsg)
                .build();
    }
}