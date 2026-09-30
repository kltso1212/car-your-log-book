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
import java.util.ArrayList;
import java.util.List;

/**
 * Mirrors dotnet/Models/ServiceRecord.cs.
 * Table: service_records(id PK, vehicle_id, date, odm, items, custom_item,
 * price). items is a JSON int[] in TEXT (2xx domain).
 * UNIQUE(vehicle_id, odm) like fuel — one service per mileage point.
 */
@Entity
@Table(name = "service_records",
        uniqueConstraints = @UniqueConstraint(
                name = "service_records_vehicle_odm_key",
                columnNames = {"vehicle_id", "odm"}))
public class ServiceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "vehicle_id", length = 20)
    private String vehicleId;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "odm")
    private int odm;

    @Column(name = "items", columnDefinition = "TEXT")
    private String items = "[]";

    @Column(name = "custom_item")
    private String customItem;

    @Column(name = "price")
    private double price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    public ServiceRecord() {
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

    public int getOdm() {
        return odm;
    }

    public void setOdm(int odm) {
        this.odm = odm;
    }

    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    /** Decoded ids for the DTO (unknown ids survive round-trip untouched). */
    @Transient
    public List<Integer> getItemIds() {
        List<Integer> ids = new ArrayList<>();
        if (items == null) return ids;
        for (String part : items.replaceAll("[\\[\\]\\s]", "").split(",")) {
            if (part.isEmpty()) continue;
            try {
                ids.add(Integer.valueOf(part));
            } catch (NumberFormatException ignored) {
                // keep going: never lose a row over one bad entry
            }
        }
        return ids;
    }

    public void setItemIds(List<Integer> ids) {
        StringBuilder sb = new StringBuilder("[");
        if (ids != null) {
            for (int i = 0; i < ids.size(); i++) {
                if (i > 0) sb.append(',');
                sb.append(ids.get(i));
            }
        }
        this.items = sb.append(']').toString();
    }

    public String getCustomItem() {
        return customItem;
    }

    public void setCustomItem(String customItem) {
        this.customItem = customItem;
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
}
