package com.example.springboot.repositories;

import com.example.springboot.models.TunnelRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TunnelRecordRepository extends JpaRepository<TunnelRecord, Long> {

    List<TunnelRecord> findByVehicleIdOrderByDateDescIdDesc(Integer vehicleId);
}
