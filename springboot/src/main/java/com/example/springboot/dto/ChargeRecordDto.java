package com.example.springboot.dto;

import com.example.springboot.models.ChargeRecord;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * Mirrors dotnet ChargeRecordDto. pricePerKwh is computed server-side.
 */
public record ChargeRecordDto(
        Long id,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
        int odm,
        double kwh,
        double price,
        double pricePerKwh) {

    public static ChargeRecordDto from(ChargeRecord r) {
        double ppk = r.getKwh() > 0 ? r.getPrice() / r.getKwh() : 0;
        return new ChargeRecordDto(r.getId(), r.getDate(), r.getOdm(),
                r.getKwh(), r.getPrice(), ppk);
    }

    /** Request body for POST/PUT: same shape minus the computed field. */
    public record Request(
            @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            int odm,
            double kwh,
            double price) {
    }
}
