package com.linqingyang.efficientoffice.service;

import com.linqingyang.efficientoffice.model.entity.TodoItem;
import com.linqingyang.efficientoffice.model.repository.TodoItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TodoItemService {
    @Autowired
    private TodoItemRepository todoItemRepository;

    public List<TodoItem> getAllTodoItems() {
        return todoItemRepository.findAll();
    }

    public TodoItem createTodoItem(TodoItem todoItem) {
        return todoItemRepository.save(todoItem);
    }

    // More service methods...
}