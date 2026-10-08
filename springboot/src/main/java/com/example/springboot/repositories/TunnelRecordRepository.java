package com.example.springboot.repositories;

import com.example.springboot.models.TunnelRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TunnelRecordRepository extends JpaRepository<TunnelRecord, Long> {

    List<TunnelRecord> findByVehicleIdOrderByDateDescIdDesc(Integer vehicleId);
}
