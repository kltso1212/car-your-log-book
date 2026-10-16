package com.example.springboot.controllers;

import com.example.springboot.dto.ImageDto;
import com.example.springboot.models.Image;
import com.example.springboot.services.ImageStorageService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Images routes: status codes and Traditional-Chinese messages mirror
 * nodejs/server.js — POST upload with replace semantics (+ optional uncropped
 * 'source' kept as &lt;kind&gt;_source), GET list by comma-separated entity ids,
 * GET file with immutable caching + ETag, DELETE row + file.
 */
@RestController
@RequestMapping("/api/images")
public class ImagesController {

    private final ImageStorageService imageStorage;

    public ImagesController(ImageStorageService imageStorage) {
        this.imageStorage = imageStorage;
    }

    @PostMapping
    public ResponseEntity<?> post(
            @RequestParam(defaultValue = "") String entityType,
            @RequestParam(defaultValue = "") String entityId,
            @RequestParam(defaultValue = "") String kind,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) MultipartFile source,
            @RequestParam(required = false) String width,
            @RequestParam(required = false) String height,
            @RequestParam(required = false) String sourceWidth,
            @RequestParam(required = false) String sourceHeight) {
        if (!imageStorage.isValidEntityType(entityType)) {
            return message(HttpStatus.BAD_REQUEST, "圖片類型無效");
        }
        Long entityNum = parseId(entityId);
        if (entityNum == null) {
            return message(HttpStatus.BAD_REQUEST, "圖片對象無效");
        }
        if (!imageStorage.isValidKind(kind)) {
            return message(HttpStatus.BAD_REQUEST, "圖片用途無效");
        }
        if (!imageStorage.entityExists(entityType, entityNum)) {
            return message(HttpStatus.NOT_FOUND,
                    entityType.equals("vehicle") ? "找不到車輛" : "找不到記錄");
        }
        if (file == null) {
            return message(HttpStatus.BAD_REQUEST, "缺少圖片");
        }
        if (!imageStorage.isAllowedMime(file.getContentType())
                || (source != null && !imageStorage.isAllowedMime(source.getContentType()))) {
            return message(HttpStatus.BAD_REQUEST, "圖片格式無效");
        }
        if (file.getSize() > ImageStorageService.MAX_IMAGE_BYTES
                || (source != null && source.getSize() > ImageStorageService.MAX_IMAGE_BYTES)) {
            return message(HttpStatus.BAD_REQUEST, "圖片太大 (最大 10MB)");
        }
        try {
            int id = entityNum.intValue(); // safe: the entity was just found
            Image image = imageStorage.replaceAndSave(entityType, id, kind,
                    file.getBytes(), file.getContentType(), intOrNull(width), intOrNull(height));
            Image sourceImage = null;
            if (source != null) {
                sourceImage = imageStorage.replaceAndSave(entityType, id, kind + "_source",
                        source.getBytes(), source.getContentType(),
                        intOrNull(sourceWidth), intOrNull(sourceHeight));
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ImageDto.Upload("圖片已上載", ImageDto.from(image),
                            sourceImage == null ? null : ImageDto.from(sourceImage)));
        } catch (IOException | UncheckedIOException e) {
            return message(HttpStatus.INTERNAL_SERVER_ERROR, "圖片上載失敗");
        }
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "") String entityType,
            @RequestParam(defaultValue = "") String entityId) {
        if (!imageStorage.isValidEntityType(entityType)) {
            return message(HttpStatus.BAD_REQUEST, "圖片類型無效");
        }
        List<Long> parsed = parseIdList(entityId);
        if (parsed.isEmpty()) {
            return message(HttpStatus.BAD_REQUEST, "圖片對象無效");
        }
        // entity_id is an int column: larger ids are valid input, just no rows.
        List<Integer> ids = parsed.stream()
                .filter(n -> n <= Integer.MAX_VALUE)
                .map(Long::intValue)
                .toList();
        if (ids.isEmpty()) {
            return ResponseEntity.ok(List.<ImageDto>of());
        }
        List<ImageDto> rows = imageStorage.listFor(entityType, ids).stream()
                .map(ImageDto::from)
                .toList();
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<?> file(
            @PathVariable String id,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        Image img = imageStorage.getById(parseId(id));
        if (img == null) {
            return message(HttpStatus.NOT_FOUND, "找不到圖片");
        }
        Path path = imageStorage.filePathOf(img.getEntityType(), img.getEntityId(), img.getFileName());
        if (!Files.isRegularFile(path)) {
            return message(HttpStatus.NOT_FOUND, "找不到圖片");
        }
        String etag = "\"img-" + img.getId() + "\"";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(img.getMime()));
            headers.set(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable");
            headers.set(HttpHeaders.ETAG, etag);
            if (etag.equals(ifNoneMatch)) {
                return ResponseEntity.status(HttpStatus.NOT_MODIFIED).headers(headers).build();
            }
            return ResponseEntity.ok().headers(headers).body(Files.readAllBytes(path));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        if (imageStorage.deleteById(parseId(id))) {
            return ResponseEntity.noContent().build();
        }
        return message(HttpStatus.NOT_FOUND, "找不到圖片");
    }

    private static ResponseEntity<Map<String, String>> message(HttpStatus status, String text) {
        return ResponseEntity.status(status).body(Map.of("message", text));
    }

    /** nodejs Number(value): only a positive integer parses, everything else is invalid. */
    private static Long parseId(String value) {
        if (value == null) return null;
        try {
            long n = Long.parseLong(value.trim());
            return n > 0 ? n : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** nodejs intOrNull(): positive integers only, anything else stores null. */
    private static Integer intOrNull(String value) {
        Long n = parseId(value);
        return n == null || n > Integer.MAX_VALUE ? null : n.intValue();
    }

    private static List<Long> parseIdList(String csv) {
        List<Long> ids = new ArrayList<>();
        for (String part : csv.split(",")) {
            Long n = parseId(part);
            if (n != null) {
                ids.add(n);
            }
        }
        return ids;
    }
}
