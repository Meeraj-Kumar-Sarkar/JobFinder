export class ApiResponse<T> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T | null;

  constructor(message: string, data: T | null = null, success = true) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}
