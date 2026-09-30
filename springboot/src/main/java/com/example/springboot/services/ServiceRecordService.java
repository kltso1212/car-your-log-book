package com.example.springboot.services;

import com.example.springboot.dto.ServiceRecordDto;
import com.example.springboot.models.ServiceRecord;
import com.example.springboot.repositories.ServiceRecordRepository;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Mirrors dotnet/Services/ServiceRecordService.cs: fuel-shaped CRUD keyed
 * on (vehicle_id, odm), items as a JSON int[].
 */
@Service
public class ServiceRecordService {

    public enum UpdateResult { UPDATED, NOT_FOUND, CONFLICT }

    private final VehicleRepository vehicles;
    private final ServiceRecordRepository serviceRecords;

    public ServiceRecordService(VehicleRepository vehicles, ServiceRecordRepository serviceRecords) {
        this.vehicles = vehicles;
        this.serviceRecords = serviceRecords;
    }

    @Transactional(readOnly = true)
    public List<ServiceRecordDto> getAll(String vehicleId) {
        return serviceRecords.findByVehicleIdOrderByOdmAsc(vehicleId).stream()
                .map(ServiceRecordDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ServiceRecord> getByOdm(String vehicleId, int odm) {
        return serviceRecords.findByVehicleIdAndOdm(vehicleId, odm);
    }

    @Transactional
    public boolean add(String vehicleId, ServiceRecordDto.Request req) {
        if (req == null) return false;
        if (!vehicles.existsById(vehicleId)) return false;
        if (serviceRecords.existsByVehicleIdAndOdm(vehicleId, req.odm())) return false;
        ServiceRecord r = new ServiceRecord();
        r.setVehicleId(vehicleId);
        r.setDate(req.date());
        r.setOdm(req.odm());
        r.setItemIds(req.items());
        r.setCustomItem(req.customItem());
        r.setPrice(req.price());
        serviceRecords.save(r);
        return true;
    }

    @Transactional
    public boolean deleteByOdm(String vehicleId, int odm) {
        var existing = serviceRecords.findByVehicleIdAndOdm(vehicleId, odm);
        if (existing.isEmpty()) return false;
        serviceRecords.delete(existing.get());
        return true;
    }

    @Transactional
    public UpdateResult update(String vehicleId, long id, ServiceRecordDto.Request req) {
        if (req == null) return UpdateResult.NOT_FOUND;
        var existing = serviceRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return UpdateResult.NOT_FOUND;
        var clash = serviceRecords.findByVehicleIdAndOdm(vehicleId, req.odm())
                .filter(r -> !r.getId().equals(id));
        if (clash.isPresent()) return UpdateResult.CONFLICT;
        ServiceRecord r = existing.get();
        r.setDate(req.date());
        r.setOdm(req.odm());
        r.setItemIds(req.items());
        r.setCustomItem(req.customItem());
        r.setPrice(req.price());
        serviceRecords.save(r);
        return UpdateResult.UPDATED;
    }
}
