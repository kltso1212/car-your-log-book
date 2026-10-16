package com.example.springboot.services;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * ddl-auto=update with the community SQLiteDialect creates bare tables:
 * UNIQUE constraints (and FKs) are silently skipped because SQLite cannot
 * ALTER them in afterwards. Create the uniqueness this app relies on
 * (duplicate detection -> 409) explicitly; IF NOT EXISTS keeps it idempotent.
 */
@Component
public class UniqueIndexMigrator implements CommandLineRunner {

    private static final String[] INDEXES = {
        "CREATE UNIQUE INDEX IF NOT EXISTS fuel_records_vehicle_odm_key ON fuel_records (vehicle_id, odm)",
        "CREATE UNIQUE INDEX IF NOT EXISTS charge_records_vehicle_odm_key ON charge_records (vehicle_id, odm)",
        "CREATE UNIQUE INDEX IF NOT EXISTS service_records_vehicle_odm_key ON service_records (vehicle_id, odm)",
        "CREATE UNIQUE INDEX IF NOT EXISTS insurance_records_vehicle_date_key ON insurance_records (vehicle_id, date)",
        "CREATE UNIQUE INDEX IF NOT EXISTS licence_records_vehicle_date_key ON licence_records (vehicle_id, date)",
        "CREATE UNIQUE INDEX IF NOT EXISTS images_entity_type_entity_id_kind_key ON images (entity_type, entity_id, kind)",
    };

    private final JdbcTemplate jdbc;

    public UniqueIndexMigrator(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        for (String ddl : INDEXES) {
            jdbc.execute(ddl);
        }
    }
}
