export type Severity = "low" | "medium" | "high" | "critical"
export type IssueStatus = "open" | "in-progress" | "resolved"
export type IssueCategory =
  | "potholes"
  | "streetLights"
  | "garbage"
  | "waterSupply"
  | "roadDamage"
  | "drainage"
  | "publicSafety"
  | "other"

export interface Issue {
  id: string
  title: string
  description: string
  category: IssueCategory
  severity: Severity
  status: IssueStatus
  location: string
  coordinates?: { lat: number; lng: number }
  photos: string[]
  upvotes: number
  commentCount: number
  reporter: string
  isAnonymous: boolean
  createdAt: string
  aiConfidence?: number
  aiCategory?: string
  severityScore?: number
  resolutionConfirmations?: number
  resolvedAt?: string
  resolvedBy?: "community" | "reporter" | "official"
}

export interface Comment {
  id: string
  issueId: string
  text: string
  author: string
  isAnonymous: boolean
  createdAt: string
}

export interface EmergencyContact {
  id: string
  organization: string
  district: string
  phone: string
  serviceType: "police" | "medical" | "utilities" | "government"
  is247: boolean
}

export interface NationalHotline {
  name: string
  number: string
  icon: string
}
