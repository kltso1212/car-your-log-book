package com.example.springboot.controllers;

import com.example.springboot.dto.FuelRecordDto;
import com.example.springboot.services.FuelRecordService;
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

/**
 * Mirrors dotnet/Controllers/FuelRecordsController.cs (route api/fuelrecords).
 */
@RestController
@RequestMapping("/api/fuelrecords")
public class FuelRecordsController {

    private final FuelRecordService fuelRecordService;

    public FuelRecordsController(FuelRecordService fuelRecordService) {
        this.fuelRecordService = fuelRecordService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<FuelRecordDto>> get(@PathVariable Integer id) {
        return ResponseEntity.ok(fuelRecordService.getAll(id));
    }

    @PostMapping("/{id}")
    public ResponseEntity<FuelRecordDto.Message> post(
            @PathVariable Integer id,
            @RequestBody FuelRecordDto.Request req) {
        boolean added = fuelRecordService.add(id, req);
        if (!added) {
            boolean exists = fuelRecordService.getByOdm(id, req.odm()).isPresent();
            if (exists) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new FuelRecordDto.Message("入油記錄已存在"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new FuelRecordDto.Message("找不到車輛"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new FuelRecordDto.Message("入油記錄已新增"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer id,
            @RequestParam int odm) {
        boolean ok = fuelRecordService.deleteByOdm(id, odm);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/{vehicleId}/{id}")
    public ResponseEntity<FuelRecordDto.Message> put(
            @PathVariable Integer vehicleId,
            @PathVariable long id,
            @RequestBody FuelRecordDto.Request req) {
        return switch (fuelRecordService.update(vehicleId, id, req)) {
            case UPDATED -> ResponseEntity.ok(new FuelRecordDto.Message("入油記錄已更新"));
            case CONFLICT -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new FuelRecordDto.Message("入油記錄已存在"));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new FuelRecordDto.Message("找不到入油記錄"));
        };
    }
}
