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
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;

/**
 * Mirrors dotnet/Models/DatedRecords.cs (LicenceRecord).
 * Table: licence_records(id PK, vehicle_id, date, type, fee).
 * UNIQUE(vehicle_id, date) — one licence per start date.
 */
@Entity
@Table(name = "licence_records",
        uniqueConstraints = @UniqueConstraint(
                name = "licence_records_vehicle_date_key",
                columnNames = {"vehicle_id", "date"}))
public class LicenceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "vehicle_id")
    private Integer vehicleId;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "type")
    private int type;

    @Column(name = "fee")
    private double fee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    public LicenceRecord() {
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

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getType() {
        return type;
    }

    public void setType(int type) {
        this.type = type;
    }

    public double getFee() {
        return fee;
    }

    public void setFee(double fee) {
        this.fee = fee;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }
}
