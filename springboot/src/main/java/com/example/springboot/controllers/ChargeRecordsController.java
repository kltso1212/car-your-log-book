package com.example.springboot.controllers;

import com.example.springboot.dto.ChargeRecordDto;
import com.example.springboot.dto.FuelRecordDto;
import com.example.springboot.services.ChargeRecordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Mirrors FuelRecordsController for charge records (electric vehicles).
 */
@RestController
@RequestMapping("/api/chargerecords")
public class ChargeRecordsController {

    private final ChargeRecordService chargeRecordService;

    public ChargeRecordsController(ChargeRecordService chargeRecordService) {
        this.chargeRecordService = chargeRecordService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<ChargeRecordDto>> get(@PathVariable Integer id) {
        return ResponseEntity.ok(chargeRecordService.getAll(id));
    }

    @PostMapping("/{id}")
    public ResponseEntity<Map<String, Object>> post(
            @PathVariable Integer id,
            @RequestBody ChargeRecordDto.Request req) {
        long newId = chargeRecordService.add(id, req);
        if (newId == -1L) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "充電記錄已存在"));
        }
        if (newId <= 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "找不到車輛"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "充電記錄已新增", "id", newId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer id,
            @RequestParam int odm) {
        boolean ok = chargeRecordService.deleteByOdm(id, odm);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/{vehicleId}/{id}")
    public ResponseEntity<FuelRecordDto.Message> put(
            @PathVariable Integer vehicleId,
            @PathVariable long id,
            @RequestBody ChargeRecordDto.Request req) {
        return switch (chargeRecordService.update(vehicleId, id, req)) {
            case UPDATED -> ResponseEntity.ok(new FuelRecordDto.Message("充電記錄已更新"));
            case CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new FuelRecordDto.Message("充電記錄已存在"));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new FuelRecordDto.Message("找不到充電記錄"));
        };
    }
}
