package com.example.springboot.dto;

import com.example.springboot.models.FineRecord;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.util.List;

/**
 * Mirrors dotnet FineRecordDto. offences travels as a JSON int[].
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FineRecordDto(
        Long id,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
        List<Integer> offences,
        String customOffence,
        String location,
        double penalty) {

    public static FineRecordDto from(FineRecord r) {
        return new FineRecordDto(r.getId(), r.getDate(), r.getOffenceIds(),
                r.getCustomOffence(), r.getLocation(), r.getPenalty());
    }

    /** Request body for POST/PUT: same shape minus the id. */
    public record Request(
            @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            List<Integer> offences,
            String customOffence,
            String location,
            double penalty) {
    }
}
