package com.example.springboot.controllers;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Liveness probe for Docker / Cloud Run / Render / Railway health checks.
 * Mirrors python/main.py /health.
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public Map<String, String> get() {
        return Map.of("status", "ok");
    }
}
