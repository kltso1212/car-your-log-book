package com.example.springboot.services;

import com.example.springboot.dto.FineRecordDto;
import com.example.springboot.models.FineRecord;
import com.example.springboot.repositories.FineRecordRepository;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Mirrors dotnet/Services/FineRecordService.cs. Deletes key on the
 * surrogate id (no natural unique key exists for fines).
 */
@Service
public class FineRecordService {

    public enum UpdateResult { UPDATED, NOT_FOUND }

    private final VehicleRepository vehicles;
    private final FineRecordRepository fineRecords;

    public FineRecordService(VehicleRepository vehicles, FineRecordRepository fineRecords) {
        this.vehicles = vehicles;
        this.fineRecords = fineRecords;
    }

    @Transactional(readOnly = true)
    public List<FineRecordDto> getAll(Integer vehicleId) {
        return fineRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId).stream()
                .map(FineRecordDto::from)
                .toList();
    }

    @Transactional
    public Long add(Integer vehicleId, FineRecordDto.Request req) {
        if (req == null) return 0L;
        if (!vehicles.existsById(vehicleId)) return 0L;
        FineRecord r = new FineRecord();
        r.setVehicleId(vehicleId);
        r.setDate(req.date());
        r.setOffenceIds(req.offences());
        r.setCustomOffence(req.customOffence());
        r.setLocation(req.location());
        r.setPenalty(req.penalty());
        return fineRecords.save(r).getId();
    }

    @Transactional
    public boolean deleteById(Integer vehicleId, long id) {
        var existing = fineRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return false;
        fineRecords.delete(existing.get());
        return true;
    }

    @Transactional
    public UpdateResult update(Integer vehicleId, long id, FineRecordDto.Request req) {
        if (req == null) return UpdateResult.NOT_FOUND;
        var existing = fineRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return UpdateResult.NOT_FOUND;
        FineRecord r = existing.get();
        r.setDate(req.date());
        r.setOffenceIds(req.offences());
        r.setCustomOffence(req.customOffence());
        r.setLocation(req.location());
        r.setPenalty(req.penalty());
        fineRecords.save(r);
        return UpdateResult.UPDATED;
    }
}
