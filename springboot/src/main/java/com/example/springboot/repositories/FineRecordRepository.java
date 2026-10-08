package com.example.springboot.repositories;

import com.example.springboot.models.FineRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FineRecordRepository extends JpaRepository<FineRecord, Long> {

    List<FineRecord> findByVehicleIdOrderByDateDescIdDesc(Integer vehicleId);
}
