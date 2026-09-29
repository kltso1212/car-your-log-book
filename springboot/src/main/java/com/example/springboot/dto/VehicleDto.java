package com.example.springboot.dto;

/**
 * Mirrors dotnet VehicleDto: { "id": "...", "type": 1 }.
 * Type: 1 petrol / 2 hybrid / 3 electric / 4 diesel. Set at creation only;
 * the controller rejects anything outside 1-4 with 400.
 */
public record VehicleDto(String id, Integer type) {
}
