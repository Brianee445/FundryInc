export type ConnectionStatus = 'pending' | 'accepted' | 'declined';
export type ConnectionInitiator = 'investor' | 'founder';

export interface ConnectionRequestRecord {
  id: string;
  investor_id: string;
  founder_profile_id: string;
  initiator: ConnectionInitiator;
  message: string | null;
  status: ConnectionStatus;
  contact_revealed_at: string | null;
  created_at: string;
  startup_name: string | null;
  investor_email: string | null;
}
