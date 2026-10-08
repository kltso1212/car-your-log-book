package com.example.springboot.controllers;

import com.example.springboot.dto.FuelRecordDto;
import com.example.springboot.dto.ParkingRecordDto;
import com.example.springboot.services.ParkingRecordService;
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

@RestController
@RequestMapping("/api/parkingrecords")
public class ParkingRecordsController {

    private final ParkingRecordService parkingRecordService;

    public ParkingRecordsController(ParkingRecordService parkingRecordService) {
        this.parkingRecordService = parkingRecordService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<ParkingRecordDto>> get(@PathVariable Integer id) {
        return ResponseEntity.ok(parkingRecordService.getAll(id));
    }

    @PostMapping("/{id}")
    public ResponseEntity<Map<String, Object>> post(
            @PathVariable Integer id,
            @RequestBody ParkingRecordDto.Request req) {
        long newId = parkingRecordService.add(id, req);
        if (newId <= 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "找不到車輛"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "泊車記錄已新增", "id", newId));
    }

    @DeleteMapping("/{vehicleId}/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer vehicleId,
            @PathVariable long id) {
        boolean ok = parkingRecordService.deleteById(vehicleId, id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/{vehicleId}/{id}")
    public ResponseEntity<FuelRecordDto.Message> put(
            @PathVariable Integer vehicleId,
            @PathVariable long id,
            @RequestBody ParkingRecordDto.Request req) {
        return switch (parkingRecordService.update(vehicleId, id, req)) {
            case UPDATED -> ResponseEntity.ok(new FuelRecordDto.Message("泊車記錄已更新"));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new FuelRecordDto.Message("找不到泊車記錄"));
        };
    }
}
