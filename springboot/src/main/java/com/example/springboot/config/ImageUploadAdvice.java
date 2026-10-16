package com.example.springboot.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

/**
 * Oversized multipart uploads explode in checkMultipart, before a handler is
 * resolved — controller-local @ExceptionHandler methods never see them, so the
 * 400 answer (nodejs multer LIMIT_FILE_SIZE parity) lives in this advice.
 */
@RestControllerAdvice
public class ImageUploadAdvice {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> tooLarge(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "圖片太大 (最大 10MB)"));
    }
}
