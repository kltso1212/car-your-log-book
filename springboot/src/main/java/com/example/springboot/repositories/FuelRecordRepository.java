package com.example.springboot.repositories;

import com.example.springboot.models.FuelRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FuelRecordRepository extends JpaRepository<FuelRecord, Long> {

    List<FuelRecord> findByVehicleIdOrderByOdmAsc(Integer vehicleId);

    Optional<FuelRecord> findByVehicleIdAndOdm(Integer vehicleId, int odm);

    boolean existsByVehicleIdAndOdm(Integer vehicleId, int odm);

    void deleteByVehicleIdAndOdm(Integer vehicleId, int odm);
}
