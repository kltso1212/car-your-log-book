package com.example.springboot.repositories;

import com.example.springboot.models.InsuranceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InsuranceRecordRepository extends JpaRepository<InsuranceRecord, Long> {

    List<InsuranceRecord> findByVehicleIdOrderByDateDescIdDesc(String vehicleId);

    boolean existsByVehicleIdAndDate(String vehicleId, java.time.LocalDate date);

    java.util.Optional<InsuranceRecord> findByVehicleIdAndDate(String vehicleId, java.time.LocalDate date);
}
