package com.example.springboot.repositories;

import com.example.springboot.models.ChargeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChargeRecordRepository extends JpaRepository<ChargeRecord, Long> {

    List<ChargeRecord> findByVehicleIdOrderByOdmAsc(Integer vehicleId);

    Optional<ChargeRecord> findByVehicleIdAndOdm(Integer vehicleId, int odm);

    boolean existsByVehicleIdAndOdm(Integer vehicleId, int odm);

    void deleteByVehicleIdAndOdm(Integer vehicleId, int odm);
}
