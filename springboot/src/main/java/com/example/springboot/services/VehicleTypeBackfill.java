package com.example.springboot.services;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Backfills pre-existing databases to petrol (1) wherever the stored type
 * is not a valid 1-4 id (e.g. legacy 'petrol' strings from the TEXT era).
 * Runs once per boot; a no-op on clean databases.
 */
@Component
public class VehicleTypeBackfill implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    public VehicleTypeBackfill(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        jdbc.execute("UPDATE vehicles SET type=1 WHERE CAST(type AS INTEGER) NOT IN (1,2,3,4)");
    }
}
