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
    requires2FA?: boolean;//?-nery hanenq?
    qrCodeUrl?: string;//
  }
  
  export interface UserResponse {
    id: number;
    username: string;
    email: string;
    createdAt: string;
    profilePhoto?: string;
    token: string;
    user: {
      id: number;
      email: string;
    };
    qrCodeUrl?: string;
  }

  export interface AuthResponse {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
    };
    requires2FA?: boolean;
    qrCodeUrl?: string;
  }