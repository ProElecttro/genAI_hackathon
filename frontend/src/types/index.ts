export type UserRole = 'interviewer' | 'candidate';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
}

export interface Interview {
  id: string;
  title: string;
  description?: string | null;
  interviewerId: string;
  candidateId?: string | null;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}