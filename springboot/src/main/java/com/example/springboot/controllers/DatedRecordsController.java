package com.example.springboot.controllers;

import com.example.springboot.dto.DatedRecordDto;
import com.example.springboot.dto.FuelRecordDto;
import com.example.springboot.services.DatedRecordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Mirrors dotnet/Controllers/DatedRecordsController.cs (insurance + licence).
 */
@RestController
@RequestMapping("/api")
public class DatedRecordsController {

    private final DatedRecordService datedRecordService;

    public DatedRecordsController(DatedRecordService datedRecordService) {
        this.datedRecordService = datedRecordService;
    }

    @GetMapping("/insurancerecords/{id}")
    public ResponseEntity<List<DatedRecordDto.Insurance>> getInsurance(@PathVariable Integer id) {
        return ResponseEntity.ok(datedRecordService.getInsurance(id));
    }

    @PostMapping("/insurancerecords/{id}")
    public ResponseEntity<Map<String, Object>> postInsurance(
            @PathVariable Integer id,
            @RequestBody DatedRecordDto.Insurance.Request req) {
        long newId = datedRecordService.addInsurance(id, req);
        if (newId == -1L) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "保險記錄已存在"));
        }
        if (newId <= 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "找不到車輛"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "保險記錄已新增", "id", newId));
    }

    @DeleteMapping("/insurancerecords/{vehicleId}/{id}")
    public ResponseEntity<Void> deleteInsurance(
            @PathVariable Integer vehicleId,
            @PathVariable long id) {
        boolean ok = datedRecordService.deleteInsurance(vehicleId, id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/insurancerecords/{vehicleId}/{id}")
    public ResponseEntity<FuelRecordDto.Message> putInsurance(
            @PathVariable Integer vehicleId,
            @PathVariable long id,
            @RequestBody DatedRecordDto.Insurance.Request req) {
        return switch (datedRecordService.updateInsurance(vehicleId, id, req)) {
            case UPDATED -> ResponseEntity.ok(new FuelRecordDto.Message("保險記錄已更新"));
            case CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new FuelRecordDto.Message("保險記錄已存在"));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new FuelRecordDto.Message("找不到保險記錄"));
        };
    }

    @GetMapping("/licencerecords/{id}")
    public ResponseEntity<List<DatedRecordDto.Licence>> getLicence(@PathVariable Integer id) {
        return ResponseEntity.ok(datedRecordService.getLicence(id));
    }

    @PostMapping("/licencerecords/{id}")
    public ResponseEntity<Map<String, Object>> postLicence(
            @PathVariable Integer id,
            @RequestBody DatedRecordDto.Licence.Request req) {
        long newId = datedRecordService.addLicence(id, req);
        if (newId == -1L) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "牌費記錄已存在"));
        }
        if (newId <= 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "找不到車輛"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "牌費記錄已新增", "id", newId));
    }

    @DeleteMapping("/licencerecords/{vehicleId}/{id}")
    public ResponseEntity<Void> deleteLicence(
            @PathVariable Integer vehicleId,
            @PathVariable long id) {
        boolean ok = datedRecordService.deleteLicence(vehicleId, id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/licencerecords/{vehicleId}/{id}")
    public ResponseEntity<FuelRecordDto.Message> putLicence(
            @PathVariable Integer vehicleId,
            @PathVariable long id,
            @RequestBody DatedRecordDto.Licence.Request req) {
        return switch (datedRecordService.updateLicence(vehicleId, id, req)) {
            case UPDATED -> ResponseEntity.ok(new FuelRecordDto.Message("牌費記錄已更新"));
            case CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new FuelRecordDto.Message("牌費記錄已存在"));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new FuelRecordDto.Message("找不到牌費記錄"));
        };
    }
}
