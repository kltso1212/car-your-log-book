package com.example.springboot.repositories;

import com.example.springboot.models.LicenceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LicenceRecordRepository extends JpaRepository<LicenceRecord, Long> {

    List<LicenceRecord> findByVehicleIdOrderByDateDescIdDesc(Integer vehicleId);

    boolean existsByVehicleIdAndDate(Integer vehicleId, java.time.LocalDate date);

    java.util.Optional<LicenceRecord> findByVehicleIdAndDate(Integer vehicleId, java.time.LocalDate date);
}
