package com.example.springboot.repositories;

import com.example.springboot.models.Image;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImageRepository extends JpaRepository<Image, Long> {

    List<Image> findByEntityTypeAndEntityId(String entityType, Integer entityId);

    List<Image> findByEntityTypeAndEntityIdAndKind(String entityType, Integer entityId, String kind);

    List<Image> findByEntityTypeAndEntityIdInOrderByIdAsc(String entityType, List<Integer> entityIds);
}
