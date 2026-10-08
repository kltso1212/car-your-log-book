package com.example.springboot.dto;

/**
 * id is an INTEGER surrogate PK; plate is non-unique (plate reuse allowed).
 * Type: 1 petrol / 2 hybrid / 3 electric / 4 diesel. Changeable via PUT;
 * the controller rejects anything outside 1-4 with 400.
 */
public record VehicleDto(Integer id, String plate, Integer type, String brand, String model, Integer year) {
}
