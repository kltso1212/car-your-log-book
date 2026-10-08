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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Table: fine_records(id PK, vehicle_id, date, offences, custom_offence,
 * location, penalty). offences is a JSON int[] in TEXT (3xx domain).
 * No UNIQUE constraint: bad days happen.
 */
@Entity
@Table(name = "fine_records")
public class FineRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "vehicle_id")
    private Integer vehicleId;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "offences", columnDefinition = "TEXT")
    private String offences = "[]";

    @Column(name = "custom_offence")
    private String customOffence;

    @Column(name = "location")
    private String location;

    @Column(name = "penalty")
    private double penalty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    public FineRecord() {
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

    public String getOffences() {
        return offences;
    }

    public void setOffences(String offences) {
        this.offences = offences;
    }

    /** Decoded ids for the DTO (unknown ids survive round-trip untouched). */
    @Transient
    public List<Integer> getOffenceIds() {
        List<Integer> ids = new ArrayList<>();
        if (offences == null) return ids;
        for (String part : offences.replaceAll("[\\[\\]\\s]", "").split(",")) {
            if (part.isEmpty()) continue;
            try {
                ids.add(Integer.valueOf(part));
            } catch (NumberFormatException ignored) {
                // keep going: never lose a row over one bad entry
            }
        }
        return ids;
    }

    public void setOffenceIds(List<Integer> ids) {
        StringBuilder sb = new StringBuilder("[");
        if (ids != null) {
            for (int i = 0; i < ids.size(); i++) {
                if (i > 0) sb.append(',');
                sb.append(ids.get(i));
            }
        }
        this.offences = sb.append(']').toString();
    }

    public String getCustomOffence() {
        return customOffence;
    }

    public void setCustomOffence(String customOffence) {
        this.customOffence = customOffence;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public double getPenalty() {
        return penalty;
    }

    public void setPenalty(double penalty) {
        this.penalty = penalty;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }
}
