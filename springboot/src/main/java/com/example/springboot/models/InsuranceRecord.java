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
 * Mirrors dotnet/Models/DatedRecords.cs (InsuranceRecord).
 * Table: insurance_records(id PK, vehicle_id, date, type, broker, fee).
 * UNIQUE(vehicle_id, date) — one policy per start date.
 */
@Entity
@Table(name = "insurance_records",
        uniqueConstraints = @UniqueConstraint(
                name = "insurance_records_vehicle_date_key",
                columnNames = {"vehicle_id", "date"}))
public class InsuranceRecord {

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

    @Column(name = "broker")
    private String broker;

    @Column(name = "fee")
    private double fee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    public InsuranceRecord() {
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

    public String getBroker() {
        return broker;
    }

    public void setBroker(String broker) {
        this.broker = broker;
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
