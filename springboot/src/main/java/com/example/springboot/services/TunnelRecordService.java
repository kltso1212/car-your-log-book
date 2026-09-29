package com.example.springboot.services;

import com.example.springboot.dto.TunnelRecordDto;
import com.example.springboot.models.TunnelRecord;
import com.example.springboot.repositories.TunnelRecordRepository;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Mirrors dotnet/Services/TunnelRecordService.cs. Deletes key on the
 * surrogate id (no natural unique key exists for tunnel trips).
 */
@Service
public class TunnelRecordService {

    public enum UpdateResult { UPDATED, NOT_FOUND }

    private final VehicleRepository vehicles;
    private final TunnelRecordRepository tunnelRecords;

    public TunnelRecordService(VehicleRepository vehicles, TunnelRecordRepository tunnelRecords) {
        this.vehicles = vehicles;
        this.tunnelRecords = tunnelRecords;
    }

    @Transactional(readOnly = true)
    public List<TunnelRecordDto> getAll(String vehicleId) {
        return tunnelRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId).stream()
                .map(TunnelRecordDto::from)
                .toList();
    }

    @Transactional
    public Long add(String vehicleId, TunnelRecordDto.Request req) {
        if (req == null) return 0L;
        if (!vehicles.existsById(vehicleId)) return 0L;
        TunnelRecord r = new TunnelRecord();
        r.setVehicleId(vehicleId);
        r.setDate(req.date());
        r.setTunnel(req.tunnel());
        r.setBound(req.bound());
        r.setFee(req.fee());
        return tunnelRecords.save(r).getId();
    }

    @Transactional
    public boolean deleteById(String vehicleId, long id) {
        var existing = tunnelRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return false;
        tunnelRecords.delete(existing.get());
        return true;
    }

    @Transactional
    public UpdateResult update(String vehicleId, long id, TunnelRecordDto.Request req) {
        if (req == null) return UpdateResult.NOT_FOUND;
        var existing = tunnelRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return UpdateResult.NOT_FOUND;
        TunnelRecord r = existing.get();
        r.setDate(req.date());
        r.setTunnel(req.tunnel());
        r.setBound(req.bound());
        r.setFee(req.fee());
        tunnelRecords.save(r);
        return UpdateResult.UPDATED;
    }
}
