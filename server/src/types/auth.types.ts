export type UserRole = "candidate" | "employer";

export interface DecodedFirebaseUser {
  uid: string;
  email?: string;
  name?: string;
}

export interface AuthenticatedUser {
  id: string;
  firebaseUID: string;
  email: string;
  role: UserRole;
}
