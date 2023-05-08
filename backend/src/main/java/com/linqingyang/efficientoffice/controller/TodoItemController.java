package com.linqingyang.efficientoffice.controller;

import com.linqingyang.efficientoffice.model.entity.TodoItem;
import com.linqingyang.efficientoffice.service.TodoItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/todo-items")
public class TodoItemController {
    @Autowired
    private TodoItemService todoItemService;

    @GetMapping
    public List<TodoItem> getAllTodoItems() {
        return todoItemService.getAllTodoItems();
    }

    @PostMapping
    public TodoItem createTodoItem(@RequestBody TodoItem todoItem) {
        return todoItemService.createTodoItem(todoItem);
    }

    // More controller methods...
}