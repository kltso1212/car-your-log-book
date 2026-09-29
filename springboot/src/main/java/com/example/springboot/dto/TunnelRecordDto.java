package com.example.springboot.dto;

import com.example.springboot.models.TunnelRecord;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * Mirrors dotnet TunnelRecordDto.
 */
public record TunnelRecordDto(
        Long id,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
        int tunnel,
        int bound,
        double fee) {

    public static TunnelRecordDto from(TunnelRecord r) {
        return new TunnelRecordDto(r.getId(), r.getDate(), r.getTunnel(),
                r.getBound(), r.getFee());
    }

    /** Request body for POST/PUT: same shape minus the id. */
    public record Request(
            @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            int tunnel,
            int bound,
            double fee) {
    }
}
