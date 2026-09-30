package com.example.springboot.repositories;

import com.example.springboot.models.ParkingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingRecordRepository extends JpaRepository<ParkingRecord, Long> {

    List<ParkingRecord> findByVehicleIdOrderByDateDescIdDesc(String vehicleId);
}
