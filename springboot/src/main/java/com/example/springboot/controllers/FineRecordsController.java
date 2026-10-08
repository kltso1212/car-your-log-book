package com.example.springboot.controllers;

import com.example.springboot.dto.FineRecordDto;
import com.example.springboot.dto.FuelRecordDto;
import com.example.springboot.services.FineRecordService;
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
@RequestMapping("/api/finerecords")
public class FineRecordsController {

    private final FineRecordService fineRecordService;

    public FineRecordsController(FineRecordService fineRecordService) {
        this.fineRecordService = fineRecordService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<FineRecordDto>> get(@PathVariable Integer id) {
        return ResponseEntity.ok(fineRecordService.getAll(id));
    }

    @PostMapping("/{id}")
    public ResponseEntity<Map<String, Object>> post(
            @PathVariable Integer id,
            @RequestBody FineRecordDto.Request req) {
        long newId = fineRecordService.add(id, req);
        if (newId <= 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "找不到車輛"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "罰款記錄已新增", "id", newId));
    }

    @DeleteMapping("/{vehicleId}/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer vehicleId,
            @PathVariable long id) {
        boolean ok = fineRecordService.deleteById(vehicleId, id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/{vehicleId}/{id}")
    public ResponseEntity<FuelRecordDto.Message> put(
            @PathVariable Integer vehicleId,
            @PathVariable long id,
            @RequestBody FineRecordDto.Request req) {
        return switch (fineRecordService.update(vehicleId, id, req)) {
            case UPDATED -> ResponseEntity.ok(new FuelRecordDto.Message("罰款記錄已更新"));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new FuelRecordDto.Message("找不到罰款記錄"));
        };
    }
}
