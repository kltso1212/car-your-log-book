package com.example.springboot.dto;

import com.example.springboot.models.Image;

/**
 * image row as JSON — camelCase mirror of nodejs imageJson():
 * url is the relative file endpoint, createdAt is the ISO-8601 created_at
 * text, width/height stay null when the upload did not carry them.
 */
public record ImageDto(
        Long id,
        String entityType,
        Integer entityId,
        String kind,
        String mime,
        Integer width,
        Integer height,
        long sizeBytes,
        String url,
        String createdAt) {

    public static ImageDto from(Image img) {
        return new ImageDto(img.getId(), img.getEntityType(), img.getEntityId(),
                img.getKind(), img.getMime(), img.getWidth(), img.getHeight(),
                img.getSizeBytes(), "/api/images/" + img.getId() + "/file",
                img.getCreatedAt());
    }

    /** POST /api/images body: source is null unless a source file was sent. */
    public record Upload(String message, ImageDto image, ImageDto source) {
    }
}
