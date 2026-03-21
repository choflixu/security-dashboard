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

    @GetMapping("/scripts")
    public ResponseEntity<Collection<SecurityScript>> listScripts() {
        return ResponseEntity.ok(registry.getAllScripts());
    }

    @GetMapping("/scripts/{id}")
    public ResponseEntity<SecurityScript> getScript(@PathVariable String id) {
        return registry.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/scripts/{id}/run")
    public ResponseEntity<Map<String, Object>> runScript(@PathVariable String id) {
        if (registry.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        executor.executeAsync(id);

        return ResponseEntity.accepted().body(Map.of(
                "status", "RUNNING",
                "scriptId", id
        ));
    }

    @GetMapping("/scripts/{id}/result")
    public ResponseEntity<ScriptResult> getLastResult(@PathVariable String id) {
        ScriptResult result = executor.getLastResult(id);
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}