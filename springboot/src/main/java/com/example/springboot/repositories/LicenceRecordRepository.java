package com.example.springboot.repositories;

import com.example.springboot.models.LicenceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LicenceRecordRepository extends JpaRepository<LicenceRecord, Long> {

    List<LicenceRecord> findByVehicleIdOrderByDateDescIdDesc(String vehicleId);

    boolean existsByVehicleIdAndDate(String vehicleId, java.time.LocalDate date);

    java.util.Optional<LicenceRecord> findByVehicleIdAndDate(String vehicleId, java.time.LocalDate date);
}
