package com.linqingyang.efficientoffice.model.repository;

import com.linqingyang.efficientoffice.model.entity.TodoItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoItemRepository extends JpaRepository<TodoItem, Long> {
}