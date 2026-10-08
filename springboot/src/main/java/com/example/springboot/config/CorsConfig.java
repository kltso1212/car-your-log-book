package com.example.springboot.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS_ORIGIN=* (default) allows any PC/phone on the LAN with no IP edits.
 * In production/cloud set CORS_ORIGIN=https://&lt;frontend-url&gt;
 * (comma-separated list supported).
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors-origin:*}")
    private String corsOrigin;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                String origins = corsOrigin == null ? "*" : corsOrigin.trim();
                if (origins.isEmpty() || origins.equals("*")) {
                    registry.addMapping("/api/**")
                            .allowedOriginPatterns("*")
                            .allowedMethods("*")
                            .allowedHeaders("*");
                } else {
                    registry.addMapping("/api/**")
                            .allowedOrigins(origins.split("\\s*,\\s*"))
                            .allowedMethods("*")
                            .allowedHeaders("*");
                }
            }
        };
    }
}
