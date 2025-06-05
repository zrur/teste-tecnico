import { User } from '../types/User';
import { Task } from '../types/Task';

class Database {
  private users: User[] = [];
  private tasks: Task[] = [];
  private userIdCounter = 1;
  private taskIdCounter = 1;

  // User methods
  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      id: this.userIdCounter++,
      ...userData,
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  findUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }

  findUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  // Task methods
  createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const task: Task = {
      id: this.taskIdCounter++,
      ...taskData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.push(task);
    return task;
  }

  findTasksByUserId(userId: number, status?: string): Task[] {
    let userTasks = this.tasks.filter(task => task.userId === userId);
    if (status) {
      userTasks = userTasks.filter(task => task.status === status);
    }
    return userTasks;
  }

  findTaskById(id: number, userId: number): Task | undefined {
    return this.tasks.find(task => task.id === id && task.userId === userId);
  }

  updateTask(id: number, userId: number, updates: Partial<Task>): Task | undefined {
    const taskIndex = this.tasks.findIndex(task => task.id === id && task.userId === userId);
    if (taskIndex === -1) return undefined;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.tasks[taskIndex];
  }

  deleteTask(id: number, userId: number): boolean {
    const taskIndex = this.tasks.findIndex(task => task.id === id && task.userId === userId);
    if (taskIndex === -1) return false;

    this.tasks.splice(taskIndex, 1);
    return true;
  }
}

export const database = new Database();
