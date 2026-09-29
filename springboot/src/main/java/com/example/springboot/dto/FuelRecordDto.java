package com.example.springboot.dto;

import com.example.springboot.models.FuelRecord;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

/**
 * Mirrors dotnet FuelRecordDto. pricePerLitre is computed server-side exactly
 * like nodejs/server.js (COALESCE(price / NULLIF(litre,0), 0)) and returned
 * so reactjs/src/services/api.ts needs no change.
 */
public record FuelRecordDto(
        Long id,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
        int odm,
        int vendor,
        int fuelType,
        double litre,
        double price,
        double pricePerLitre) {

    public static FuelRecordDto from(FuelRecord r) {
        double ppl = r.getLitre() > 0 ? r.getPrice() / r.getLitre() : 0;
        return new FuelRecordDto(r.getId(), r.getDate(), r.getOdm(), r.getVendor(),
                r.getFuelType(), r.getLitre(), r.getPrice(), ppl);
    }

    /** Request body for POST: same shape minus the computed field. */
    public record Request(
            @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            int odm,
            int vendor,
            int fuelType,
            double litre,
            double price) {
    }

    /** Error/message body, same shape as the Node.js backend messages. */
    public record Message(@JsonProperty("message") String message) {
    }
}
