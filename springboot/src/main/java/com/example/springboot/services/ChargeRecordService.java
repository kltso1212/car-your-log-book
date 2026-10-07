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

    public ChargeRecordService(VehicleRepository vehicles, ChargeRecordRepository chargeRecords) {
        this.vehicles = vehicles;
        this.chargeRecords = chargeRecords;
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
    public boolean add(Integer vehicleId, ChargeRecordDto.Request req) {
        if (req == null) return false;
        if (!vehicles.existsById(vehicleId)) return false;
        if (chargeRecords.existsByVehicleIdAndOdm(vehicleId, req.odm())) return false;
        ChargeRecord r = new ChargeRecord();
        r.setVehicleId(vehicleId);
        r.setDate(req.date());
        r.setOdm(req.odm());
        r.setKwh(req.kwh());
        r.setPrice(req.price());
        chargeRecords.save(r);
        return true;
    }

    @Transactional
    public boolean deleteByOdm(Integer vehicleId, int odm) {
        if (!chargeRecords.existsByVehicleIdAndOdm(vehicleId, odm)) return false;
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
