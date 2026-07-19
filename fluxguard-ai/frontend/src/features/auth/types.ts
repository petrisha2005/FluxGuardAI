export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  preferred_language: string;
  is_active: boolean;
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  user: UserProfile;
}
