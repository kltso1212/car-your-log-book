package com.example.springboot.controllers;

import com.example.springboot.dto.FuelRecordDto;
import com.example.springboot.dto.VehicleDto;
import com.example.springboot.services.VehicleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Mirrors dotnet/Controllers/VehiclesController.cs (route api/vehicles).
 * Status codes aligned with the Node.js backend + frontend expectations:
 * empty list -> 200 [] (frontend handles res.data ?? []), duplicate -> 409.
 */
@RestController
@RequestMapping("/api/vehicles")
public class VehiclesController {

    private final VehicleService vehicleService;

    public VehiclesController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<VehicleDto>> get() {
        return ResponseEntity.ok(vehicleService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDto> getById(@PathVariable String id) {
        return vehicleService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FuelRecordDto.Message> post(@RequestBody VehicleDto req) {
        if (req.type() == null || req.type() < 1 || req.type() > 4) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new FuelRecordDto.Message("車輛類別無效"));
        }
        boolean ok = vehicleService.add(req);
        if (!ok) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new FuelRecordDto.Message("車輛已被註冊"));
        }
        return ResponseEntity.ok(new FuelRecordDto.Message("車輛註冊成功"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boolean ok = vehicleService.deleteById(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
