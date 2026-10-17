// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type UserRole = "student" | "editor" | "admin";
export type EventStatus = "draft" | "open" | "closed" | "completed" | "cancelled";
export type RegStatus = "pending_payment" | "receipt_uploaded" | "approved" | "rejected" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_gazi_student: boolean;
  faculty: string | null;
  department: string | null;
  role: UserRole;
  created_at: string;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  location_id: string | null;
  starts_at: string;
  ends_at: string | null;
  registration_deadline: string | null;
  price_try: number;
  capacity: number;
  payment_info: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  itinerary?: unknown;
  highlights?: unknown;
}

export interface Album {
  id: string;
  event_id: string | null;
  title: string;
  cover_image: string | null;
  created_at: string;
}

export interface AlbumPhoto {
  id: string;
  album_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  category: string;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationItem {
  id: string;
  event_id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  tc_no: string | null;
  student_no: string | null;
  status: RegStatus;
  receipt_path: string | null;
  admin_note: string | null;
  ticket_nonce: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
}

