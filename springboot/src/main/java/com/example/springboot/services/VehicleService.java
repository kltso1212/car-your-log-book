package com.example.springboot.services;

import com.example.springboot.dto.VehicleDto;
import com.example.springboot.models.Vehicle;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Mirrors dotnet/Services/VehicleService.cs:
 * GetAll / GetById / Add (returns new id) / Update / DeleteById.
 * Plate is non-unique: duplicates are allowed (plate reuse for a new car).
 */
@Service
public class VehicleService {

    private final VehicleRepository vehicles;

    public VehicleService(VehicleRepository vehicles) {
        this.vehicles = vehicles;
    }

    public static String normalizePlate(String plate) {
        return plate == null ? "" : plate.strip().toUpperCase();
    }

    public static boolean isValidYear(Integer year) {
        if (year == null) return true;
        int now = LocalDate.now().getYear() + 1;
        return year >= 1900 && year <= now;
    }

    private static String trimmed(String v) {
        return v == null ? "" : v.strip();
    }

    @Transactional(readOnly = true)
    public List<VehicleDto> getAll() {
        return vehicles.findAll().stream()
                .sorted((a, b) -> a.getId().compareTo(b.getId()))
                .map(v -> new VehicleDto(v.getId(), v.getPlate(),
                        v.getType() == null ? 1 : v.getType(),
                        v.getBrand() == null ? "" : v.getBrand(),
                        v.getModel() == null ? "" : v.getModel(),
                        v.getYear()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<VehicleDto> getById(Integer id) {
        return vehicles.findById(id)
                .map(v -> new VehicleDto(v.getId(), v.getPlate(),
                        v.getType() == null ? 1 : v.getType(),
                        v.getBrand() == null ? "" : v.getBrand(),
                        v.getModel() == null ? "" : v.getModel(),
                        v.getYear()));
    }

    @Transactional
    public Integer add(VehicleDto req) {
        if (req == null || normalizePlate(req.plate()).isEmpty()) return null;
        Vehicle saved = vehicles.save(new Vehicle(
                normalizePlate(req.plate()),
                req.type(),
                trimmed(req.brand()),
                trimmed(req.model()),
                req.year()));
        return saved.getId();
    }

    @Transactional
    public boolean update(Integer id, VehicleDto req) {
        var existing = vehicles.findById(id);
        if (existing.isEmpty()) return false;
        Vehicle v = existing.get();
        v.setPlate(normalizePlate(req.plate()));
        v.setType(req.type());
        v.setBrand(trimmed(req.brand()));
        v.setModel(trimmed(req.model()));
        v.setYear(req.year());
        vehicles.save(v);
        return true;
    }

    @Transactional
    public boolean deleteById(Integer id) {
        if (!vehicles.existsById(id)) return false;
        vehicles.deleteById(id);
        return true;
    }
}
