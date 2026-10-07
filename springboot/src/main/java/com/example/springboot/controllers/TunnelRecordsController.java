package com.example.springboot.controllers;

import com.example.springboot.dto.FuelRecordDto;
import com.example.springboot.dto.TunnelRecordDto;
import com.example.springboot.services.TunnelRecordService;
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
 * Mirrors dotnet/Controllers/TunnelRecordsController.cs.
 */
@RestController
@RequestMapping("/api/tunnelrecords")
public class TunnelRecordsController {

    private final TunnelRecordService tunnelRecordService;

    public TunnelRecordsController(TunnelRecordService tunnelRecordService) {
        this.tunnelRecordService = tunnelRecordService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<TunnelRecordDto>> get(@PathVariable Integer id) {
        return ResponseEntity.ok(tunnelRecordService.getAll(id));
    }

    @PostMapping("/{id}")
    public ResponseEntity<Map<String, Object>> post(
            @PathVariable Integer id,
            @RequestBody TunnelRecordDto.Request req) {
        long newId = tunnelRecordService.add(id, req);
        if (newId <= 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "找不到車輛"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "隧道記錄已新增", "id", newId));
    }

    @DeleteMapping("/{vehicleId}/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer vehicleId,
            @PathVariable long id) {
        boolean ok = tunnelRecordService.deleteById(vehicleId, id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/{vehicleId}/{id}")
    public ResponseEntity<FuelRecordDto.Message> put(
            @PathVariable Integer vehicleId,
            @PathVariable long id,
            @RequestBody TunnelRecordDto.Request req) {
        return switch (tunnelRecordService.update(vehicleId, id, req)) {
            case UPDATED -> ResponseEntity.ok(new FuelRecordDto.Message("隧道記錄已更新"));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new FuelRecordDto.Message("找不到隧道記錄"));
        };
    }
}
