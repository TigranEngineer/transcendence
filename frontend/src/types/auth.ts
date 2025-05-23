export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
    };
  }
  
  export interface UserResponse {
    id: number;
    username: string;
    email: string;
    createdAt: string;
  }