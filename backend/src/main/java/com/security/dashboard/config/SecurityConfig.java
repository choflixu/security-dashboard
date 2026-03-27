package com.security.dashboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuración de seguridad y CORS moderna para Spring Boot 3.x / Spring Security 6.1+
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Desactiva CSRF si no usas formularios con cookies
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/**").permitAll() // Permite todas las rutas
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource())); // Configuración CORS moderna

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ⚡ Permite cualquier frontend (ngrok, Vercel, etc.)
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // necesario si usas cookies o auth

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // aplica a todas las rutas

        return source;
    }
}