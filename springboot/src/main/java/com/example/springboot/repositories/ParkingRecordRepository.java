package com.example.springboot.repositories;

import com.example.springboot.models.ParkingRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParkingRecordRepository extends JpaRepository<ParkingRecord, Long> {

    List<ParkingRecord> findByVehicleIdOrderByDateDescIdDesc(Integer vehicleId);
}
