export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface ConnectionRequestRecord {
  id: string;
  investor_id: string;
  founder_profile_id: string;
  message: string | null;
  status: ConnectionStatus;
  contact_revealed_at: string | null;
  created_at: string;
  startup_name: string | null;
  investor_email: string | null;
}
