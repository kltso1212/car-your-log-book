package com.example.springboot.services;

import com.example.springboot.dto.FuelRecordDto;
import com.example.springboot.models.FuelRecord;
import com.example.springboot.repositories.FuelRecordRepository;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Mirrors dotnet/Services/FuelRecordService.cs:
 * GetAll(vehicleId) ordered by odm / GetByOdm / Add (false when vehicle
 * missing or odm duplicate) / DeleteByOdm (false when missing) /
 * Update (by surrogate id, scoped to vehicle).
 */
@Service
public class FuelRecordService {

    public enum UpdateResult { UPDATED, NOT_FOUND, CONFLICT }

    private final VehicleRepository vehicles;
    private final FuelRecordRepository fuelRecords;

    public FuelRecordService(VehicleRepository vehicles, FuelRecordRepository fuelRecords) {
        this.vehicles = vehicles;
        this.fuelRecords = fuelRecords;
    }

    @Transactional(readOnly = true)
    public List<FuelRecordDto> getAll(Integer vehicleId) {
        return fuelRecords.findByVehicleIdOrderByOdmAsc(vehicleId).stream()
                .map(FuelRecordDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<FuelRecord> getByOdm(Integer vehicleId, int odm) {
        return fuelRecords.findByVehicleIdAndOdm(vehicleId, odm);
    }

    @Transactional
    public boolean add(Integer vehicleId, FuelRecordDto.Request req) {
        if (req == null) return false;
        if (!vehicles.existsById(vehicleId)) return false;
        if (fuelRecords.existsByVehicleIdAndOdm(vehicleId, req.odm())) return false;
        FuelRecord r = new FuelRecord();
        r.setVehicleId(vehicleId);
        r.setDate(req.date());
        r.setOdm(req.odm());
        r.setVendor(req.vendor());
        r.setFuelType(req.fuelType());
        r.setLitre(req.litre());
        r.setPrice(req.price());
        fuelRecords.save(r);
        return true;
    }

    @Transactional
    public boolean deleteByOdm(Integer vehicleId, int odm) {
        if (!fuelRecords.existsByVehicleIdAndOdm(vehicleId, odm)) return false;
        fuelRecords.deleteByVehicleIdAndOdm(vehicleId, odm);
        return true;
    }

    @Transactional
    public UpdateResult update(Integer vehicleId, long id, FuelRecordDto.Request req) {
        if (req == null) return UpdateResult.NOT_FOUND;
        var existing = fuelRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return UpdateResult.NOT_FOUND;
        var clash = fuelRecords.findByVehicleIdAndOdm(vehicleId, req.odm())
                .filter(r -> !r.getId().equals(id));
        if (clash.isPresent()) return UpdateResult.CONFLICT;
        FuelRecord r = existing.get();
        r.setDate(req.date());
        r.setOdm(req.odm());
        r.setVendor(req.vendor());
        r.setFuelType(req.fuelType());
        r.setLitre(req.litre());
        r.setPrice(req.price());
        fuelRecords.save(r);
        return UpdateResult.UPDATED;
    }
}
