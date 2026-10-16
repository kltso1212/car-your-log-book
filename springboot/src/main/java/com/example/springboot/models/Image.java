package com.example.springboot.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Table: images(id PK, entity_type, entity_id, kind, file_name, mime,
 * width, height, size_bytes, created_at) + UNIQUE(entity_type, entity_id, kind).
 * One row per uploaded file: avatar/receipt per entity, plus '&lt;kind&gt;_source'
 * for the uncropped original. No FK on purpose: rows are cleaned up in code
 * when the owning vehicle/record is deleted (nodejs/images.js parity).
 */
@Entity
@Table(name = "images",
        uniqueConstraints = @UniqueConstraint(
                name = "images_entity_type_entity_id_kind_key",
                columnNames = {"entity_type", "entity_id", "kind"}))
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Integer entityId;

    @Column(name = "kind", nullable = false)
    private String kind;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "mime", nullable = false)
    private String mime;

    // width/height nullable: not every upload carries them (nodejs stores null).
    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    // ISO-8601 instant text, same format nodejs writes (new Date().toISOString()).
    @Column(name = "created_at", nullable = false)
    private String createdAt;

    public Image() {
    }

    public Long getId() {
        return id;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMime() {
        return mime;
    }

    public void setMime(String mime) {
        this.mime = mime;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
