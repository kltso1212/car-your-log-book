package com.example.springboot.repositories;

import com.example.springboot.models.FuelRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FuelRecordRepository extends JpaRepository<FuelRecord, Long> {

    /** Mirrors the Node.js ORDER BY odm listing. */
    List<FuelRecord> findByVehicleIdOrderByOdmAsc(Integer vehicleId);

    Optional<FuelRecord> findByVehicleIdAndOdm(Integer vehicleId, int odm);

    boolean existsByVehicleIdAndOdm(Integer vehicleId, int odm);

    void deleteByVehicleIdAndOdm(Integer vehicleId, int odm);
}
