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
    profilePhoto?: string;
    twoFASecret?: string; // Added for 2FA status
}

export interface TwoFASetupResponse {
    secret: string;
    otpauthUrl: string;
}

export interface TwoFAVerifyRequest {
    userId: number;
    code: string;
}

export type LoginResponse = AuthResponse | { twoFARequired: true; userId: number };
