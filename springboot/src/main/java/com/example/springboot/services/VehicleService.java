package com.example.springboot.services;

import com.example.springboot.dto.VehicleDto;
import com.example.springboot.models.Vehicle;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Mirrors dotnet/Services/VehicleService.cs:
 * GetAll / GetById / Add (false when duplicate) / DeleteById (false when missing).
 * Ids are stored as-given (frontend upper-cases on input); the dotnet
 * id.ToUpper() calls are no-ops (result discarded) so nothing is lost.
 */
@Service
public class VehicleService {

    private final VehicleRepository vehicles;

    public VehicleService(VehicleRepository vehicles) {
        this.vehicles = vehicles;
    }

    @Transactional(readOnly = true)
    public List<VehicleDto> getAll() {
        return vehicles.findAll().stream()
                .sorted((a, b) -> a.getId().compareTo(b.getId()))
                .map(v -> new VehicleDto(v.getId(), v.getType() == null ? 1 : v.getType()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<VehicleDto> getById(String id) {
        return vehicles.findById(id)
                .map(v -> new VehicleDto(v.getId(), v.getType() == null ? 1 : v.getType()));
    }

    @Transactional
    public boolean add(VehicleDto req) {
        if (req == null || req.id() == null || req.id().isBlank()) return false;
        if (vehicles.existsById(req.id())) return false;
        vehicles.save(new Vehicle(req.id(), req.type()));
        return true;
    }

    @Transactional
    public boolean deleteById(String id) {
        if (!vehicles.existsById(id)) return false;
        vehicles.deleteById(id);
        return true;
    }
}
