package com.example.springboot.models;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Stores LocalDate as ISO 'YYYY-MM-DD' TEXT — the same format the
 * nodejs/python/dotnet backends (and the android app) use, so one SQLite
 * file works unchanged across all of them (including the shared /data
 * volume in compose). Without this, the dialect expects a full timestamp
 * string and chokes on plain dates.
 */
@Converter(autoApply = true)
public class LocalDateStringConverter implements AttributeConverter<LocalDate, String> {

    @Override
    public String convertToDatabaseColumn(LocalDate attribute) {
        return attribute == null ? null : attribute.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    @Override
    public LocalDate convertToEntityAttribute(String dbData) {
        return dbData == null ? null : LocalDate.parse(dbData, DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
