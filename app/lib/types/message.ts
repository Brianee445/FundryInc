export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  is_mine: boolean;
}

export interface MessageThread {
  connection_id: string;
  counterparty_label: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}
