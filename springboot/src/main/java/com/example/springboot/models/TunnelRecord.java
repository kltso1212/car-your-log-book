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
 * Table: tunnel_records(id PK, vehicle_id, date, tunnel, bound, fee).
 * No UNIQUE constraint: same tunnel twice a day is normal.
 */
@Entity
@Table(name = "tunnel_records")
public class TunnelRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "vehicle_id")
    private Integer vehicleId;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "tunnel")
    private int tunnel;

    @Column(name = "bound")
    private int bound;

    @Column(name = "fee")
    private double fee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    public TunnelRecord() {
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

    public int getTunnel() {
        return tunnel;
    }

    public void setTunnel(int tunnel) {
        this.tunnel = tunnel;
    }

    public int getBound() {
        return bound;
    }

    public void setBound(int bound) {
        this.bound = bound;
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
