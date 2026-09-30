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

import java.time.LocalDate;

/**
 * Mirrors dotnet/Models/ParkingRecord.cs.
 * Table: parking_records(id PK, vehicle_id, date, carpark, rental_type, fee).
 * No UNIQUE constraint: multiple parks per day are normal.
 */
@Entity
@Table(name = "parking_records")
public class ParkingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "vehicle_id", length = 20)
    private String vehicleId;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "carpark", length = 100)
    private String carpark;

    @Column(name = "rental_type")
    private int rentalType;

    @Column(name = "fee")
    private double fee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    public ParkingRecord() {
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

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getCarpark() {
        return carpark;
    }

    public void setCarpark(String carpark) {
        this.carpark = carpark;
    }

    public int getRentalType() {
        return rentalType;
    }

    public void setRentalType(int rentalType) {
        this.rentalType = rentalType;
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
