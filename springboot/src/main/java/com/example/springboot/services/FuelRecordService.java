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
 * GetAll(vehicleId) ordered by odm / GetByOdm / Add (new id; -1 odm duplicate,
 * 0 vehicle missing) / DeleteByOdm (false when missing, drops the record's
 * images first) / Update (by surrogate id, scoped to vehicle).
 */
@Service
public class FuelRecordService {

    public enum UpdateResult { UPDATED, NOT_FOUND, CONFLICT }

    private final VehicleRepository vehicles;
    private final FuelRecordRepository fuelRecords;
    private final ImageStorageService imageStorage;

    public FuelRecordService(VehicleRepository vehicles, FuelRecordRepository fuelRecords,
            ImageStorageService imageStorage) {
        this.vehicles = vehicles;
        this.fuelRecords = fuelRecords;
        this.imageStorage = imageStorage;
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
    public Long add(Integer vehicleId, FuelRecordDto.Request req) {
        if (req == null) return 0L;
        if (!vehicles.existsById(vehicleId)) return 0L;
        if (fuelRecords.existsByVehicleIdAndOdm(vehicleId, req.odm())) return -1L;
        FuelRecord r = new FuelRecord();
        r.setVehicleId(vehicleId);
        r.setDate(req.date());
        r.setOdm(req.odm());
        r.setVendor(req.vendor());
        r.setFuelType(req.fuelType());
        r.setLitre(req.litre());
        r.setPrice(req.price());
        return fuelRecords.save(r).getId();
    }

    @Transactional
    public boolean deleteByOdm(Integer vehicleId, int odm) {
        var existing = fuelRecords.findByVehicleIdAndOdm(vehicleId, odm);
        if (existing.isEmpty()) return false;
        // Nodejs selects the record ids first, then drops their images.
        imageStorage.deleteImagesFor("fuel_record", existing.get().getId());
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
