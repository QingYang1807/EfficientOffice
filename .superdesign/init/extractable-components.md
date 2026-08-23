# Extractable Components

## Layout Components

## MainLayout
- Source: `frontend/src/layouts/MainLayout.vue`
- Category: layout
- Description: Persistent application shell with header, account menu, collapsible sidebar, and route content.
- Extractable props: activeRoute (string), isCollapsed (boolean), userName (string), userAvatar (string), showUserMenu (boolean)
- Hardcoded: Logo assets, profile/settings/logout labels and icons, 200px/64px sidebar widths, shell CSS.

## AppMenu
- Source: `frontend/src/components/AppMenu.vue`
- Category: layout
- Description: Persistent collapsible sidebar menu sourced from the saved menu configuration.
- Extractable props: isCollapse (boolean), activeMenu (string), menuNodes (array)
- Hardcoded: Expand/Fold icons, sidebar dimensions, collapse-button placement, scrollbar CSS.

## RenderMenuNodes
- Source: `frontend/src/components/RenderMenuNodes.vue`
- Category: layout
- Description: Recursive nested navigation renderer for internal, iframe, embedded web, and external links.
- Extractable props: menuNodes (array), activeItem (string)
- Hardcoded: Navigation prefix semantics (@, #, /web-view), Element Plus menu markup, registered icon set.

## Basic Components

## FancyInput
- Source: `frontend/src/components/FancyInput.vue`
- Category: basic
- Description: Rich task-entry control with category, priority, date range, and quick options.
- Extractable props: modelValue (string), category (string), priority (string), dueDate (date), dueDateRange (array), showCategory (boolean), showPriority (boolean), showOptions (boolean)
- Hardcoded: Category and priority labels/colors, toolbar icons, dropdown item text, detailed scoped CSS.

## EditDialog
- Source: `frontend/src/components/EditDialog.vue`
- Category: basic
- Description: Add/edit modal for navigation items with site icon selection and upload support.
- Extractable props: modelValue (boolean), currentItem (object)
- Hardcoded: Chinese field labels, dialog width, upload endpoint, Plus icon, form CSS.

## FolderCard
- Source: `frontend/src/components/FolderCard.vue`
- Category: basic
- Description: Reusable folder tile with click, edit, and delete actions.
- Extractable props: folder (object), isActive (boolean), showActions (boolean)
- Hardcoded: Folder icon, action icon names, card CSS.

## WebsiteCard
- Source: `frontend/src/components/WebsiteCard.vue`
- Category: basic
- Description: Reusable website shortcut tile with favicon, title, and item actions.
- Extractable props: website (object), isActive (boolean), showActions (boolean)
- Hardcoded: Fallback icon behavior, action icon names, card CSS.

## TodoItem
- Source: `frontend/src/components/TodoItem.vue`
- Category: basic
- Description: Compact editable todo row with completion and deletion actions.
- Extractable props: todo (object), isEditing (boolean)
- Hardcoded: Element Plus checkbox/button/input composition and local action labels.

## NoteList
- Source: `frontend/src/components/NoteList.vue`
- Category: basic
- Description: Notes collection list with selected, pinned, empty, and delete states.
- Extractable props: notes (array), selectedNote (object), showPinned (boolean)
- Hardcoded: Star/Delete icons, empty-state text, date display, list CSS.

## GoalCreator
- Source: `frontend/src/components/goals/GoalCreator.vue`
- Category: basic
- Description: Goal creation form with scheduling and milestone fields.
- Extractable props: visible (boolean), defaultType (string), defaultDates (array)
- Hardcoded: Goal type options, Chinese labels, Plus icon, validation messages, form layout CSS.
