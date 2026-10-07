package com.example.springboot.repositories;

import com.example.springboot.models.ServiceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRecordRepository extends JpaRepository<ServiceRecord, Long> {

    List<ServiceRecord> findByVehicleIdOrderByOdmAsc(Integer vehicleId);

    Optional<ServiceRecord> findByVehicleIdAndOdm(Integer vehicleId, int odm);

    boolean existsByVehicleIdAndOdm(Integer vehicleId, int odm);
}
