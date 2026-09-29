package com.example.springboot.repositories;

import com.example.springboot.models.FuelRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FuelRecordRepository extends JpaRepository<FuelRecord, Long> {

    /** Mirrors the Node.js ORDER BY odm listing. */
    List<FuelRecord> findByVehicleIdOrderByOdmAsc(String vehicleId);

    Optional<FuelRecord> findByVehicleIdAndOdm(String vehicleId, int odm);

    boolean existsByVehicleIdAndOdm(String vehicleId, int odm);

    void deleteByVehicleIdAndOdm(String vehicleId, int odm);
}
