package com.security.dashboard.controller;

import com.security.dashboard.model.ScriptResult;
import com.security.dashboard.model.SecurityScript;
import com.security.dashboard.service.ScriptExecutionService;
import com.security.dashboard.service.ScriptRegistryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * API REST del Security Dashboard.
 *
 * GET  /api/scripts          - Listado de todos los scripts disponibles
 * GET  /api/scripts/{id}     - Detalle de un script
 * POST /api/scripts/{id}/run - Ejecutar un script (responde inmediatamente, output via WS)
 * GET  /api/scripts/{id}/result - Ultimo resultado conocido
 */
@RestController
@RequestMapping("/api")
public class SecurityController {

    private final ScriptRegistryService registry;
    private final ScriptExecutionService executor;

    public SecurityController(ScriptRegistryService registry,
                               ScriptExecutionService executor) {
        this.registry = registry;
        this.executor = executor;
    }

    /**
     * Lista todos los scripts registrados.
     * El frontend usara esta respuesta para pintar los iconos del dashboard.
     */
    @GetMapping("/scripts")
    public ResponseEntity<Collection<SecurityScript>> listScripts() {
        return ResponseEntity.ok(registry.getAllScripts());
    }

    /**
     * Detalle de un script especifico.
     */
    @GetMapping("/scripts/{id}")
    public ResponseEntity<SecurityScript> getScript(@PathVariable String id) {
        return registry.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Dispara la ejecucion de un script.
     * Responde de forma inmediata con {"status":"RUNNING"}.
     * La salida en tiempo real llega por WebSocket al topic:
     *   /topic/script-output/{id}
     */
    @PostMapping("/scripts/{id}/run")
    public ResponseEntity<Map<String, Object>> runScript(@PathVariable String id) {
        if (registry.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CompletableFuture<ScriptResult> future = executor.executeAsync(id);

        // No bloqueamos; el cliente recibe el resultado via WebSocket
        future.thenAccept(result ->
            System.out.println("Script " + id + " finalizado con estado: " + result.getStatus())
        );

        return ResponseEntity.accepted().body(Map.of(
                "status", "RUNNING",
                "scriptId", id,
                "websocketTopic", "/topic/script-output/" + id
        ));
    }

    /**
     * Devuelve el ultimo resultado almacenado de un script.
     * Util para restaurar el estado al recargar el frontend.
     */
    @GetMapping("/scripts/{id}/result")
    public ResponseEntity<ScriptResult> getLastResult(@PathVariable String id) {
        ScriptResult result = executor.getLastResult(id);
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Health check - usado por Railway/Render para verificar que el servicio esta vivo.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
