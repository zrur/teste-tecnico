// tests/helpers/testHelper.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../src/entities/User';
import { Task } from '../../src/entities/Task';
import { TestDataSource } from '../setup';

export class TestHelper {
  private userRepository = TestDataSource.getRepository(User);
  private taskRepository = TestDataSource.getRepository(Task);

  /**
   * Criar usuário de teste
   */
  async createTestUser(email = 'test@example.com', password = '123456'): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword
    });
    return await this.userRepository.save(user);
  }

  /**
   * Gerar token JWT para testes
   */
  generateToken(userId: number): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  }

  /**
   * Criar tarefa de teste
   */
  async createTestTask(owner: User, title = 'Tarefa de teste', completed = false): Promise<Task> {
    const task = this.taskRepository.create({
      title,
      completed: completed ? 1 : 0, // Oracle format
      owner
    });
    return await this.taskRepository.save(task);
  }

  /**
   * Criar múltiplas tarefas para testes de paginação
   */
  async createMultipleTasks(owner: User, count = 25): Promise<Task[]> {
    const tasks = [];
    for (let i = 1; i <= count; i++) {
      const task = this.taskRepository.create({
        title: `Tarefa ${i}`,
        completed: i % 3 === 0 ? 1 : 0, // Algumas concluídas
        owner
      });
      tasks.push(task);
    }
    return await this.taskRepository.save(tasks);
  }

  /**
   * Limpar dados de teste
   */
  async cleanup(): Promise<void> {
    try {
      await this.taskRepository.delete({});
      await this.userRepository.delete({});
    } catch (error) {
      console.warn('Erro ao limpar dados de teste:', error);
    }
  }

  /**
   * Verificar se Oracle está conectado
   */
  async checkConnection(): Promise<boolean> {
    try {
      await TestDataSource.query('SELECT 1 FROM DUAL');
      return true;
    } catch (error) {
      console.error('Oracle connection failed:', error);
      return false;
    }
  }
}