package com.example.springboot.dto;

import com.example.springboot.models.ServiceRecord;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.util.List;

/**
 * Mirrors dotnet ServiceRecordDto. items travels as a JSON int[].
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ServiceRecordDto(
        Long id,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
        int odm,
        List<Integer> items,
        String customItem,
        double price) {

    public static ServiceRecordDto from(ServiceRecord r) {
        return new ServiceRecordDto(r.getId(), r.getDate(), r.getOdm(),
                r.getItemIds(), r.getCustomItem(), r.getPrice());
    }

    /** Request body for POST/PUT: same shape minus the id. */
    public record Request(
            @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            int odm,
            List<Integer> items,
            String customItem,
            double price) {
    }
}
