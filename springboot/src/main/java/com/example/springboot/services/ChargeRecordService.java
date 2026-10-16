package com.example.springboot.services;

import com.example.springboot.dto.ChargeRecordDto;
import com.example.springboot.models.ChargeRecord;
import com.example.springboot.repositories.ChargeRecordRepository;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Mirrors FuelRecordService for charge records (electric vehicles).
 */
@Service
public class ChargeRecordService {

    public enum UpdateResult { UPDATED, NOT_FOUND, CONFLICT }

    private final VehicleRepository vehicles;
    private final ChargeRecordRepository chargeRecords;
    private final ImageStorageService imageStorage;

    public ChargeRecordService(VehicleRepository vehicles, ChargeRecordRepository chargeRecords,
            ImageStorageService imageStorage) {
        this.vehicles = vehicles;
        this.chargeRecords = chargeRecords;
        this.imageStorage = imageStorage;
    }

    @Transactional(readOnly = true)
    public List<ChargeRecordDto> getAll(Integer vehicleId) {
        return chargeRecords.findByVehicleIdOrderByOdmAsc(vehicleId).stream()
                .map(ChargeRecordDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ChargeRecord> getByOdm(Integer vehicleId, int odm) {
        return chargeRecords.findByVehicleIdAndOdm(vehicleId, odm);
    }

    @Transactional
    public Long add(Integer vehicleId, ChargeRecordDto.Request req) {
        if (req == null) return 0L;
        if (!vehicles.existsById(vehicleId)) return 0L;
        if (chargeRecords.existsByVehicleIdAndOdm(vehicleId, req.odm())) return -1L;
        ChargeRecord r = new ChargeRecord();
        r.setVehicleId(vehicleId);
        r.setDate(req.date());
        r.setOdm(req.odm());
        r.setKwh(req.kwh());
        r.setPrice(req.price());
        return chargeRecords.save(r).getId();
    }

    @Transactional
    public boolean deleteByOdm(Integer vehicleId, int odm) {
        var existing = chargeRecords.findByVehicleIdAndOdm(vehicleId, odm);
        if (existing.isEmpty()) return false;
        imageStorage.deleteImagesFor("charge_record", existing.get().getId());
        chargeRecords.deleteByVehicleIdAndOdm(vehicleId, odm);
        return true;
    }

    @Transactional
    public UpdateResult update(Integer vehicleId, long id, ChargeRecordDto.Request req) {
        if (req == null) return UpdateResult.NOT_FOUND;
        var existing = chargeRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return UpdateResult.NOT_FOUND;
        var clash = chargeRecords.findByVehicleIdAndOdm(vehicleId, req.odm())
                .filter(r -> !r.getId().equals(id));
        if (clash.isPresent()) return UpdateResult.CONFLICT;
        ChargeRecord r = existing.get();
        r.setDate(req.date());
        r.setOdm(req.odm());
        r.setKwh(req.kwh());
        r.setPrice(req.price());
        chargeRecords.save(r);
        return UpdateResult.UPDATED;
    }
}
