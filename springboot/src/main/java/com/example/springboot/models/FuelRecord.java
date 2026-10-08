package com.example.springboot.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;

/**
 * Table: fuel_records(id PK, vehicle_id, date, odm, vendor, fuel_type, litre, price).
 * odm is unique per vehicle only (UNIQUE vehicle_id, odm), not the table PK.
 * JSON names (fuelType, pricePerLitre) match what reactjs/src/services/api.ts expects.
 */
@Entity
@Table(name = "fuel_records",
        uniqueConstraints = @UniqueConstraint(
                name = "fuel_records_vehicle_odm_key",
                columnNames = {"vehicle_id", "odm"}))
public class FuelRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "vehicle_id")
    private Integer vehicleId;

    @Column(name = "odm")
    private int odm;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "vendor")
    private int vendor;

    @Column(name = "fuel_type")
    private int fuelType;

    @Column(name = "litre")
    private double litre;

    @Column(name = "price")
    private double price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    public FuelRecord() {
    }

    public Long getId() {
        return id;
    }

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
    }

    public int getOdm() {
        return odm;
    }

    public void setOdm(int odm) {
        this.odm = odm;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getVendor() {
        return vendor;
    }

    public void setVendor(int vendor) {
        this.vendor = vendor;
    }

    public int getFuelType() {
        return fuelType;
    }

    public void setFuelType(int fuelType) {
        this.fuelType = fuelType;
    }

    public double getLitre() {
        return litre;
    }

    public void setLitre(double litre) {
        this.litre = litre;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    /** Mirrors FuelRecordDto.PricePerLitre: price / litre, 0 when litre is 0. */
    @Transient
    public double getPricePerLitre() {
        return litre > 0 ? price / litre : 0;
    }
}
