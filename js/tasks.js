// Tasks management for TimeMap extension

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const tasksListElement = document.getElementById('tasks-list');
  const tasksCountElement = document.getElementById('tasks-count');
  const newTaskInput = document.getElementById('new-task');
  const addTaskBtn = document.getElementById('add-task-btn');
  const tasksSection = document.querySelector('.tasks-section');

  // Check if tasks should be displayed
  chrome.storage.sync.get(['showTasks'], (result) => {
    if (result.showTasks === 'false') {
      tasksSection.style.display = 'none';
    }
  });

  // Load saved tasks
  loadTasks();

  // Event listeners
  addTaskBtn.addEventListener('click', addTask);
  newTaskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  });

  // Functions
  function loadTasks() {
    chrome.storage.sync.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      renderTasks(tasks);
      updateTaskCount(tasks);
    });
  }

  function renderTasks(tasks) {
    // Clear current tasks
    tasksListElement.innerHTML = '';

    if (tasks.length === 0) {
      // Show placeholder when no tasks
      const noTasks = document.createElement('div');
      noTasks.className = 'task-item empty';
      noTasks.textContent = 'No tasks for today. Add one below!';
      tasksListElement.appendChild(noTasks);
      tasksListElement.style.overflow = 'visible'; // Prevent scrollbar when empty
      tasksListElement.classList.remove('has-scroll');
      return;
    }

    // We'll add the class after we've added all task elements
    tasksListElement.style.overflow = 'hidden'; // Temporarily hide overflow
    
    // Add each task
    tasks.forEach((task, index) => {
      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => toggleTaskCompletion(index));
      
      const taskText = document.createElement('span');
      taskText.className = 'task-text';
      taskText.textContent = task.text;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = 'Delete task';
      deleteBtn.addEventListener('click', () => deleteTask(index));
      
      taskItem.appendChild(checkbox);
      taskItem.appendChild(taskText);
      taskItem.appendChild(deleteBtn);
      
      tasksListElement.appendChild(taskItem);
    });
    
    // Check if we need scrolling
    setTimeout(() => {
      const needsScroll = tasksListElement.scrollHeight > tasksListElement.clientHeight;
      if (needsScroll) {
        tasksListElement.classList.add('has-scroll');
        tasksListElement.style.overflow = 'auto';
      } else {
        tasksListElement.classList.remove('has-scroll');
        tasksListElement.style.overflow = 'visible';
      }
    }, 10);
  }

  function addTask() {
    const taskText = newTaskInput.value.trim();
    if (taskText === '') return;

    chrome.storage.sync.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      const newTask = {
        text: taskText,
        completed: false,
        created: new Date().toISOString(),
      };
      
      tasks.push(newTask);
      chrome.storage.sync.set({ tasks: tasks }, () => {
        renderTasks(tasks);
        updateTaskCount(tasks);
        newTaskInput.value = '';
      });
    });
  }

  function toggleTaskCompletion(index) {
    chrome.storage.sync.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      if (tasks[index]) {
        tasks[index].completed = !tasks[index].completed;
        chrome.storage.sync.set({ tasks: tasks }, () => {
          renderTasks(tasks);
          updateTaskCount(tasks);
        });
      }
    });
  }

  function deleteTask(index) {
    chrome.storage.sync.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      if (tasks[index]) {
        tasks.splice(index, 1);
        chrome.storage.sync.set({ tasks: tasks }, () => {
          renderTasks(tasks);
          updateTaskCount(tasks);
        });
      }
    });
  }

  function updateTaskCount(tasks) {
    const completedTasks = tasks.filter(task => task.completed).length;
    tasksCountElement.textContent = `${completedTasks}/${tasks.length}`;
  }

  // Allow for drag-and-drop reordering
  function setupDragAndDrop() {
    // This would implement drag-and-drop functionality for reordering tasks
    // For a future enhancement
  }
}); 