package com.example.springboot.services;

import com.example.springboot.dto.ParkingRecordDto;
import com.example.springboot.models.ParkingRecord;
import com.example.springboot.repositories.ParkingRecordRepository;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Mirrors dotnet/Services/ParkingRecordService.cs. Deletes key on the
 * surrogate id (no natural unique key exists for parking visits).
 */
@Service
public class ParkingRecordService {

    public enum UpdateResult { UPDATED, NOT_FOUND }

    private final VehicleRepository vehicles;
    private final ParkingRecordRepository parkingRecords;

    public ParkingRecordService(VehicleRepository vehicles, ParkingRecordRepository parkingRecords) {
        this.vehicles = vehicles;
        this.parkingRecords = parkingRecords;
    }

    @Transactional(readOnly = true)
    public List<ParkingRecordDto> getAll(Integer vehicleId) {
        return parkingRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId).stream()
                .map(ParkingRecordDto::from)
                .toList();
    }

    @Transactional
    public Long add(Integer vehicleId, ParkingRecordDto.Request req) {
        if (req == null) return 0L;
        if (!vehicles.existsById(vehicleId)) return 0L;
        ParkingRecord r = new ParkingRecord();
        r.setVehicleId(vehicleId);
        r.setDate(req.date());
        r.setCarpark(req.carpark());
        r.setRentalType(req.rentalType());
        r.setFee(req.fee());
        return parkingRecords.save(r).getId();
    }

    @Transactional
    public boolean deleteById(Integer vehicleId, long id) {
        var existing = parkingRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return false;
        parkingRecords.delete(existing.get());
        return true;
    }

    @Transactional
    public UpdateResult update(Integer vehicleId, long id, ParkingRecordDto.Request req) {
        if (req == null) return UpdateResult.NOT_FOUND;
        var existing = parkingRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return UpdateResult.NOT_FOUND;
        ParkingRecord r = existing.get();
        r.setDate(req.date());
        r.setCarpark(req.carpark());
        r.setRentalType(req.rentalType());
        r.setFee(req.fee());
        parkingRecords.save(r);
        return UpdateResult.UPDATED;
    }
}
