package com.example.springboot.dto;

import com.example.springboot.models.InsuranceRecord;
import com.example.springboot.models.LicenceRecord;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;

/**
 * type: insurance 1 第三者 / 2 綜合,
 * licence 1 四個月 / 2 十二個月.
 */
public final class DatedRecordDto {

    private DatedRecordDto() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Insurance(
            Long id,
            @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            int type,
            String broker,
            double fee) {

        public static Insurance from(InsuranceRecord r) {
            return new Insurance(r.getId(), r.getDate(), r.getType(),
                    r.getBroker(), r.getFee());
        }

        public record Request(
                @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
                int type,
                String broker,
                double fee) {
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Licence(
            Long id,
            @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
            int type,
            double fee) {

        public static Licence from(LicenceRecord r) {
            return new Licence(r.getId(), r.getDate(), r.getType(), r.getFee());
        }

        public record Request(
                @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
                int type,
                double fee) {
        }
    }
}
