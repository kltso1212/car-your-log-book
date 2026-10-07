package com.example.springboot.repositories;

import com.example.springboot.models.InsuranceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InsuranceRecordRepository extends JpaRepository<InsuranceRecord, Long> {

    List<InsuranceRecord> findByVehicleIdOrderByDateDescIdDesc(Integer vehicleId);

    boolean existsByVehicleIdAndDate(Integer vehicleId, java.time.LocalDate date);

    java.util.Optional<InsuranceRecord> findByVehicleIdAndDate(Integer vehicleId, java.time.LocalDate date);
}
