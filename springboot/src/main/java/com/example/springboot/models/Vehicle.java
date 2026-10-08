package com.example.springboot.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;

import java.util.ArrayList;
import java.util.List;

/**
 * Table: vehicles(id INTEGER PK, plate, type, brand, model, year).
 * plate is non-unique: the same plate may appear on 2+ rows (plate reuse).
 */
@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "plate", nullable = false)
    private String plate = "";

    // Nullable on purpose: ddl-auto=update must be able to add this column
    // to pre-existing databases (SQLite rejects ADD COLUMN ... NOT NULL).
    // Reads normalize null -> 1 (petrol) in VehicleService.
    @Column(name = "type", columnDefinition = "integer default 1")
    private Integer type = 1;

    @Column(name = "brand", columnDefinition = "text default ''")
    private String brand = "";

    @Column(name = "model", columnDefinition = "text default ''")
    private String model = "";

    @Column(name = "year")
    private Integer year;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FuelRecord> fuelRecords = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChargeRecord> chargeRecords = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TunnelRecord> tunnelRecords = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParkingRecord> parkingRecords = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FineRecord> fineRecords = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceRecord> serviceRecords = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InsuranceRecord> insuranceRecords = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LicenceRecord> licenceRecords = new ArrayList<>();

    public Vehicle() {
    }

    public Vehicle(String plate, Integer type, String brand, String model, Integer year) {
        this.plate = plate;
        this.type = type == null ? 1 : type;
        this.brand = brand == null ? "" : brand;
        this.model = model == null ? "" : model;
        this.year = year;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getPlate() {
        return plate;
    }

    public void setPlate(String plate) {
        this.plate = plate;
    }

    public Integer getType() {
        return type;
    }

    public void setType(Integer type) {
        this.type = type;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public List<FuelRecord> getFuelRecords() {
        return fuelRecords;
    }
}
