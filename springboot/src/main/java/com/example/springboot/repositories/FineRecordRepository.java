package com.example.springboot.repositories;

import com.example.springboot.models.FineRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FineRecordRepository extends JpaRepository<FineRecord, Long> {

    List<FineRecord> findByVehicleIdOrderByDateDescIdDesc(String vehicleId);
}
