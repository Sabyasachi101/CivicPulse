export type UserRole = 'citizen' | 'official' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  ward: string;
  points: number;
  badges: string[];
  streak: number;
  lastReportedDate?: string;
  createdAt: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  ward: string;
  address: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio';
}

export interface StatusLog {
  status: string;
  changedBy: string; // Name or role of the person who changed it
  changedByUid?: string;
  note: string;
  timestamp: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: number; // 1 to 5
  status: 'reported' | 'under_review' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  location: LocationInfo;
  media: MediaItem[];
  reportedBy: string; // UID of user or "anonymous"
  reportedByName?: string;
  upvotes: string[]; // List of user UIDs who upvoted
  duplicateOf?: string; // ID of the master issue if this is a duplicate
  priorityScore: number;

  source: 'app' | 'whatsapp';
  statusHistory: StatusLog[];
  assignedTo?: string; // Name or ID of assignee
  department?: string; // e.g. PWD, Water Board, BESCOM, Sanitation
  slaDue?: string; // ISO string
  resolvedProofUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  ward: string;
  summary: string;
  generatedAt: string;
  issueCount: number;
  topCategory: string;
  pulseScore: number; // PulseScore™ (0 - 100)
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'status_change' | 'badge_earned' | 'insight_generated' | 'upvote';
  read: boolean;
  issueId?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  createdAt: string;
}

import { WARDS_LIST as GEO_WARDS_LIST, STATE_CITY_WARD_MAP as GEO_STATE_CITY_WARD_MAP, parseWardString as geoParseWardString } from './lib/indiaGeography';

export const WARDS_LIST = GEO_WARDS_LIST;
export const STATE_CITY_WARD_MAP = GEO_STATE_CITY_WARD_MAP;
export const parseWardString = geoParseWardString;


export const CATEGORIES_LIST = [
  "Pothole & Roads",
  "Water Leakage & Sewage",
  "Garbage & Sanitation",
  "Streetlight & Electricity",
  "Encroachment & Footpaths",
  "Drainage & Flooding",
  "Others"
];

export const DEPARTMENTS_LIST = [
  "BBMP - PWD (Roads)",
  "BWSSB (Water & Sewage)",
  "BESCOM (Electricity)",
  "BBMP - Solid Waste Management",
  "Traffic Police (Encroachment)"
];

export const BADGES_LIST = [
  { id: 'first_reporter', name: 'First Reporter', desc: 'Reported your first civic issue', icon: '🏆' },
  { id: 'neighborhood_hero', name: 'Neighbourhood Hero', desc: 'Reported 5 or more verified issues', icon: '🌟' },
  { id: 'verified_contributor', name: 'Verified Contributor', desc: 'Earned 100 or more points', icon: '🛡️' },
  { id: 'streak_resolver', name: '10-Streak Resolver', desc: 'Maintained a reporting or review streak', icon: '🔥' }
];
