package com.example.springboot.dto;

import com.example.springboot.models.ParkingRecord;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * rentalType: 1 時租 / 2 月租.
 */
public record ParkingRecordDto(
        Long id,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
        String carpark,
        int rentalType,
        double fee) {

    public static ParkingRecordDto from(ParkingRecord r) {
        return new ParkingRecordDto(r.getId(), r.getDate(), r.getCarpark(),
                r.getRentalType(), r.getFee());
    }

    /** Request body for POST/PUT: same shape minus the id. */
    public record Request(
            @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            String carpark,
            int rentalType,
            double fee) {
    }
}
