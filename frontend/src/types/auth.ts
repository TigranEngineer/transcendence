export interface UserResponse {
  id: number;
  username: string;
  email: string;
  createdAt: string
  profilePhoto?: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
  twoFactorEnabled?: boolean; // Remains here as part of login response
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface Enable2FAResponse {
  qrCodeUrl: string;
  secret: string;
}

export interface Verify2FAResponse {
  verified: boolean;
}

export interface Disable2FAResponse {
  message: string;
}

  export interface WinsAndGames
  {
    wins: number;
    games: number;
  }

  export interface WinsAndGames
  {
    wins: number;
    games: number;
  }

  export interface RecordMatchResultRequest {
    matchId: number;
    winnerId: number;
  }
  
  export interface Friend {
    id: number;
    username: string;
    profilePhoto?: string;
  }
  
  export interface ExtendedUserResponse extends UserResponse {
    friends?: Friend[];
  }