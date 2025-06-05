export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  dueDate?: Date;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: 'pending' | 'completed';
  dueDate?: string;
}
