package com.example.springboot.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;

import java.util.ArrayList;
import java.util.List;

/**
 * Mirrors dotnet/Models/Vehicle.cs.
 * Table: vehicles(id).
 */
@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @Column(name = "id", length = 20)
    private String id;

    // Nullable on purpose: ddl-auto=update must be able to add this column
    // to pre-existing databases (SQLite rejects ADD COLUMN ... NOT NULL).
    // Reads normalize null -> 1 (petrol) in VehicleService.
    @Column(name = "type", columnDefinition = "integer default 1")
    private Integer type = 1;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FuelRecord> fuelRecords = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChargeRecord> chargeRecords = new ArrayList<>();

    public Vehicle() {
    }

    public Vehicle(String id) {
        this.id = id;
    }

    public Vehicle(String id, Integer type) {
        this.id = id;
        this.type = type == null ? 1 : type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public List<FuelRecord> getFuelRecords() {
        return fuelRecords;
    }
}
