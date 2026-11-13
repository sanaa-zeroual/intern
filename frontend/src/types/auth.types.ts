export type UserRole =
  | "magasinier"
  | "viewer"
  | "bdm"
  | "responsable_bdm";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}