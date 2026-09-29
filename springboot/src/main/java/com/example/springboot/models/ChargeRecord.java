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
 * Mirrors dotnet/Models/ChargeRecord.cs.
 * Table: charge_records(id PK, vehicle_id, date, odm, kwh, price).
 * odm is unique per vehicle only (UNIQUE vehicle_id, odm), not the table PK.
 * JSON names (pricePerKwh) match what the react frontend expects.
 */
@Entity
@Table(name = "charge_records",
        uniqueConstraints = @UniqueConstraint(
                name = "charge_records_vehicle_odm_key",
                columnNames = {"vehicle_id", "odm"}))
public class ChargeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "vehicle_id", length = 20)
    private String vehicleId;

    @Column(name = "odm")
    private int odm;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "kwh")
    private double kwh;

    @Column(name = "price")
    private double price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    public ChargeRecord() {
    }

    public Long getId() {
        return id;
    }

    public String getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(String vehicleId) {
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

    public double getKwh() {
        return kwh;
    }

    public void setKwh(double kwh) {
        this.kwh = kwh;
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

    /** price / kwh, 0 when kwh is 0. */
    @Transient
    public double getPricePerKwh() {
        return kwh > 0 ? price / kwh : 0;
    }
}
