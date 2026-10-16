package com.example.springboot.services;

import com.example.springboot.models.Image;
import com.example.springboot.repositories.ChargeRecordRepository;
import com.example.springboot.repositories.FineRecordRepository;
import com.example.springboot.repositories.ImageRepository;
import com.example.springboot.repositories.InsuranceRecordRepository;
import com.example.springboot.repositories.LicenceRecordRepository;
import com.example.springboot.repositories.ParkingRecordRepository;
import com.example.springboot.repositories.ServiceRecordRepository;
import com.example.springboot.repositories.TunnelRecordRepository;
import com.example.springboot.repositories.FuelRecordRepository;
import com.example.springboot.repositories.VehicleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Image storage helper mirroring nodejs/images.js: files live under UPLOAD_DIR
 * (default: directory of SQLITE_PATH + '/uploads') laid out as
 * &lt;uploadDir&gt;/&lt;entity_type&gt;/&lt;entity_id&gt;/&lt;uuid&gt;.&lt;ext&gt;,
 * db rows in `images` keyed by (entity_type, entity_id, kind) — one avatar per
 * vehicle, one receipt per record; the optional uncropped original is stored
 * as '&lt;kind&gt;_source'. Delete paths collect ids first so Hibernate's
 * vehicle cascade cannot orphan rows/files.
 */
@Service
public class ImageStorageService {

    /** entity_type whitelist -> the record set cleaned on vehicle delete. */
    public static final Set<String> ENTITY_TYPES = Set.of(
            "vehicle", "fuel_record", "charge_record", "tunnel_record",
            "parking_record", "fine_record", "service_record",
            "insurance_record", "licence_record");

    /** Upload purposes; '&lt;kind&gt;_source' rows are stored implicitly. */
    public static final Set<String> KINDS = Set.of("avatar", "receipt");

    /** image/* extensions, keyed by the accepted MIME types. */
    public static final Map<String, String> ALLOWED_MIME = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp");

    public static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;

    private final Path uploadDir;
    private final ImageRepository images;
    private final VehicleRepository vehicles;
    private final FuelRecordRepository fuelRecords;
    private final ChargeRecordRepository chargeRecords;
    private final TunnelRecordRepository tunnelRecords;
    private final ParkingRecordRepository parkingRecords;
    private final FineRecordRepository fineRecords;
    private final ServiceRecordRepository serviceRecords;
    private final InsuranceRecordRepository insuranceRecords;
    private final LicenceRecordRepository licenceRecords;

    public ImageStorageService(
            @Value("${UPLOAD_DIR:}") String uploadDirProp,
            @Value("${SQLITE_PATH:../sqlite.db}") String sqlitePath,
            ImageRepository images,
            VehicleRepository vehicles,
            FuelRecordRepository fuelRecords,
            ChargeRecordRepository chargeRecords,
            TunnelRecordRepository tunnelRecords,
            ParkingRecordRepository parkingRecords,
            FineRecordRepository fineRecords,
            ServiceRecordRepository serviceRecords,
            InsuranceRecordRepository insuranceRecords,
            LicenceRecordRepository licenceRecords) {
        // UPLOAD_DIR overrides the location; otherwise uploads sit next to the
        // SQLite file (same layout in every backend, see nodejs/images.js).
        if (uploadDirProp == null || uploadDirProp.trim().isEmpty()) {
            Path db = Paths.get(sqlitePath).toAbsolutePath().normalize();
            Path parent = db.getParent();
            this.uploadDir = (parent == null ? Paths.get("") : parent).resolve("uploads");
        } else {
            this.uploadDir = Paths.get(uploadDirProp.trim()).toAbsolutePath().normalize();
        }
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create upload dir " + uploadDir, e);
        }
        this.images = images;
        this.vehicles = vehicles;
        this.fuelRecords = fuelRecords;
        this.chargeRecords = chargeRecords;
        this.tunnelRecords = tunnelRecords;
        this.parkingRecords = parkingRecords;
        this.fineRecords = fineRecords;
        this.serviceRecords = serviceRecords;
        this.insuranceRecords = insuranceRecords;
        this.licenceRecords = licenceRecords;
    }

    public boolean isValidEntityType(String entityType) {
        return ENTITY_TYPES.contains(entityType);
    }

    public boolean isValidKind(String kind) {
        return KINDS.contains(kind);
    }

    public boolean isAllowedMime(String mime) {
        return mime != null && ALLOWED_MIME.containsKey(mime);
    }

    public boolean entityExists(String entityType, long entityId) {
        if (entityId <= 0 || entityId > Integer.MAX_VALUE) return false;
        int id = (int) entityId;
        return switch (entityType) {
            case "vehicle" -> vehicles.existsById(id);
            case "fuel_record" -> fuelRecords.existsById((long) id);
            case "charge_record" -> chargeRecords.existsById((long) id);
            case "tunnel_record" -> tunnelRecords.existsById((long) id);
            case "parking_record" -> parkingRecords.existsById((long) id);
            case "fine_record" -> fineRecords.existsById((long) id);
            case "service_record" -> serviceRecords.existsById((long) id);
            case "insurance_record" -> insuranceRecords.existsById((long) id);
            case "licence_record" -> licenceRecords.existsById((long) id);
            default -> false;
        };
    }

    public Path filePathOf(String entityType, Integer entityId, String fileName) {
        return uploadDir.resolve(entityType).resolve(String.valueOf(entityId)).resolve(fileName);
    }

    /**
     * Replaces any existing row+file for (entity_type, entity_id, kind), then
     * writes the bytes under uploads/&lt;entityType&gt;/&lt;entityId&gt;/&lt;uuid&gt;.&lt;ext&gt;
     * and inserts the new row.
     */
    @Transactional
    public Image replaceAndSave(String entityType, int entityId, String kind,
            byte[] bytes, String mime, Integer width, Integer height) {
        List<Image> existing = images.findByEntityTypeAndEntityIdAndKind(entityType, entityId, kind);
        for (Image row : existing) {
            removeImageFile(entityType, entityId, row.getFileName());
        }
        if (!existing.isEmpty()) {
            images.deleteAll(existing);
            // Flush the deletes before the IDENTITY insert below, otherwise
            // Hibernate runs the insert first and hits UNIQUE(entity_type, ...).
            images.flush();
        }
        Image img = new Image();
        img.setEntityType(entityType);
        img.setEntityId(entityId);
        img.setKind(kind);
        img.setFileName(saveImageFile(bytes, entityType, entityId, mime));
        img.setMime(mime);
        img.setWidth(width);
        img.setHeight(height);
        img.setSizeBytes(bytes.length);
        img.setCreatedAt(Instant.now().truncatedTo(ChronoUnit.MILLIS).toString());
        return images.save(img);
    }

    /**
     * Removes db rows + files for one entity (all kinds: avatar, avatar_source,
     * receipt). Out-of-range ids cannot have rows — skip instead of truncating.
     */
    @Transactional
    public int deleteImagesFor(String entityType, long entityId) {
        if (entityId <= 0 || entityId > Integer.MAX_VALUE) return 0;
        int id = (int) entityId;
        List<Image> rows = images.findByEntityTypeAndEntityId(entityType, id);
        for (Image row : rows) {
            removeImageFile(entityType, id, row.getFileName());
        }
        if (!rows.isEmpty()) images.deleteAll(rows);
        return rows.size();
    }

    /**
     * Deleting a vehicle cascades its records away, so their images would be
     * orphaned — collect record ids first, then drop every related image.
     * Must run BEFORE the vehicle row is deleted.
     */
    @Transactional
    public void deleteVehicleImages(Integer vehicleId) {
        deleteImagesFor("vehicle", vehicleId);
        fuelRecords.findByVehicleIdOrderByOdmAsc(vehicleId)
                .forEach(r -> deleteImagesFor("fuel_record", r.getId()));
        chargeRecords.findByVehicleIdOrderByOdmAsc(vehicleId)
                .forEach(r -> deleteImagesFor("charge_record", r.getId()));
        tunnelRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId)
                .forEach(r -> deleteImagesFor("tunnel_record", r.getId()));
        parkingRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId)
                .forEach(r -> deleteImagesFor("parking_record", r.getId()));
        fineRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId)
                .forEach(r -> deleteImagesFor("fine_record", r.getId()));
        serviceRecords.findByVehicleIdOrderByOdmAsc(vehicleId)
                .forEach(r -> deleteImagesFor("service_record", r.getId()));
        insuranceRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId)
                .forEach(r -> deleteImagesFor("insurance_record", r.getId()));
        licenceRecords.findByVehicleIdOrderByDateDescIdDesc(vehicleId)
                .forEach(r -> deleteImagesFor("licence_record", r.getId()));
    }

    @Transactional(readOnly = true)
    public List<Image> listFor(String entityType, List<Integer> entityIds) {
        return images.findByEntityTypeAndEntityIdInOrderByIdAsc(entityType, entityIds);
    }

    @Transactional(readOnly = true)
    public Image getById(Long id) {
        return id == null ? null : images.findById(id).orElse(null);
    }

    /** Removes one row + its file; false when the row does not exist. */
    @Transactional
    public boolean deleteById(Long id) {
        if (id == null) return false;
        var row = images.findById(id);
        if (row.isEmpty()) return false;
        Image img = row.get();
        removeImageFile(img.getEntityType(), img.getEntityId(), img.getFileName());
        images.delete(img);
        return true;
    }

    private String saveImageFile(byte[] bytes, String entityType, int entityId, String mime) {
        String fileName = UUID.randomUUID() + "." + ALLOWED_MIME.get(mime);
        Path target = filePathOf(entityType, entityId, fileName);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return fileName;
    }

    /** Missing file is tolerated; any other IO error propagates (nodejs ENOENT parity). */
    private void removeImageFile(String entityType, Integer entityId, String fileName) {
        if (fileName == null || fileName.isEmpty()) return;
        try {
            Files.deleteIfExists(filePathOf(entityType, entityId, fileName));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
