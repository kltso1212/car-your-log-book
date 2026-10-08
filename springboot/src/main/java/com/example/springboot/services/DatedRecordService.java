package com.example.springboot.services;

import com.example.springboot.dto.DatedRecordDto;
import com.example.springboot.models.InsuranceRecord;
import com.example.springboot.models.LicenceRecord;
import com.example.springboot.repositories.InsuranceRecordRepository;
import com.example.springboot.repositories.LicenceRecordRepository;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Both tables carry
 * UNIQUE(vehicle_id, date): constraint violations surface as CONFLICT.
 */
@Service
public class DatedRecordService {

    public enum UpdateResult { UPDATED, NOT_FOUND, CONFLICT }

    private final VehicleRepository vehicles;
    private final InsuranceRecordRepository insuranceRecords;
    private final LicenceRecordRepository licenceRecords;

    public DatedRecordService(VehicleRepository vehicles,
                              InsuranceRecordRepository insuranceRecords,
                              LicenceRecordRepository licenceRecords) {
        this.vehicles = vehicles;
        this.insuranceRecords = insuranceRecords;
        this.licenceRecords = licenceRecords;
    }

    // ---- insurance ----

    @Transactional(readOnly = true)
    public List<DatedRecordDto.Insurance> getInsurance(Integer vehicleId) {
        return insuranceRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId).stream()
                .map(DatedRecordDto.Insurance::from)
                .toList();
    }

    @Transactional
    public Long addInsurance(Integer vehicleId, DatedRecordDto.Insurance.Request req) {
        if (req == null || !vehicles.existsById(vehicleId)) return 0L;
        // App-level duplicate check (matches fuel/service pattern): the
        // SQLite dialect error codes don't translate to catchable
        // DataIntegrityViolationException reliably.
        if (insuranceRecords.existsByVehicleIdAndDate(vehicleId, req.date())) return -1L;
        try {
            InsuranceRecord r = new InsuranceRecord();
            r.setVehicleId(vehicleId);
            r.setDate(req.date());
            r.setType(req.type());
            r.setBroker(req.broker());
            r.setFee(req.fee());
            // Flush inside the try: with IDENTITY the INSERT may otherwise
            // defer to commit, escaping the catch as a 500.
            return insuranceRecords.saveAndFlush(r).getId();
        } catch (DataIntegrityViolationException e) {
            return -1L;
        }
    }

    @Transactional
    public boolean deleteInsurance(Integer vehicleId, long id) {
        var existing = insuranceRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return false;
        insuranceRecords.delete(existing.get());
        return true;
    }

    @Transactional
    public UpdateResult updateInsurance(Integer vehicleId, long id, DatedRecordDto.Insurance.Request req) {
        if (req == null) return UpdateResult.NOT_FOUND;
        var existing = insuranceRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return UpdateResult.NOT_FOUND;
        var clash = insuranceRecords.findByVehicleIdAndDate(vehicleId, req.date())
                .filter(r -> !r.getId().equals(id));
        if (clash.isPresent()) return UpdateResult.CONFLICT;
        try {
            InsuranceRecord r = existing.get();
            r.setDate(req.date());
            r.setType(req.type());
            r.setBroker(req.broker());
            r.setFee(req.fee());
            insuranceRecords.saveAndFlush(r);
            return UpdateResult.UPDATED;
        } catch (DataIntegrityViolationException e) {
            return UpdateResult.CONFLICT;
        }
    }

    // ---- licence ----

    @Transactional(readOnly = true)
    public List<DatedRecordDto.Licence> getLicence(Integer vehicleId) {
        return licenceRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId).stream()
                .map(DatedRecordDto.Licence::from)
                .toList();
    }

    @Transactional
    public Long addLicence(Integer vehicleId, DatedRecordDto.Licence.Request req) {
        if (req == null || !vehicles.existsById(vehicleId)) return 0L;
        // App-level duplicate check, same reason as addInsurance.
        if (licenceRecords.existsByVehicleIdAndDate(vehicleId, req.date())) return -1L;
        try {
            LicenceRecord r = new LicenceRecord();
            r.setVehicleId(vehicleId);
            r.setDate(req.date());
            r.setType(req.type());
            r.setFee(req.fee());
            // Flush inside the try: see addInsurance.
            return licenceRecords.saveAndFlush(r).getId();
        } catch (DataIntegrityViolationException e) {
            return -1L;
        }
    }

    @Transactional
    public boolean deleteLicence(Integer vehicleId, long id) {
        var existing = licenceRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return false;
        licenceRecords.delete(existing.get());
        return true;
    }

    @Transactional
    public UpdateResult updateLicence(Integer vehicleId, long id, DatedRecordDto.Licence.Request req) {
        if (req == null) return UpdateResult.NOT_FOUND;
        var existing = licenceRecords.findById(id).filter(r -> r.getVehicleId().equals(vehicleId));
        if (existing.isEmpty()) return UpdateResult.NOT_FOUND;
        var clash = licenceRecords.findByVehicleIdAndDate(vehicleId, req.date())
                .filter(r -> !r.getId().equals(id));
        if (clash.isPresent()) return UpdateResult.CONFLICT;
        try {
            LicenceRecord r = existing.get();
            r.setDate(req.date());
            r.setType(req.type());
            r.setFee(req.fee());
            licenceRecords.saveAndFlush(r);
            return UpdateResult.UPDATED;
        } catch (DataIntegrityViolationException e) {
            return UpdateResult.CONFLICT;
        }
    }
}
