import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organization table for multi-tenancy
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // unique identifier, e.g., "my-church"
    plan: v.string(), // "self-hosted", "free", "basic", "premium"
    status: v.string(), // "active", "suspended", "trial"
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  ministries: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    active: v.boolean(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_name", ["name"]),

  users: defineTable({
    organizationId: v.id("organizations"),
    userId: v.string(), // Clerk ID
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.union(
      v.literal("newcomer"),
      v.literal("member"),
      v.literal("leader"),
      v.literal("finance"), // Kept for backward compatibility/during migration
      v.literal("admin")
    ),
    isFinance: v.optional(v.boolean()),
    ministryIds: v.array(v.id("ministries")),
    birthday: v.optional(v.string()),
    anniversary: v.optional(v.string()),
    gender: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.optional(v.string()), // e.g., "Active", "New"
    group: v.optional(v.string()), // Small Group Name
    socials: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        xHandle: v.optional(v.string()),
      })
    ),
    isActive: v.optional(v.boolean()), // For soft delete (Clerk sync)
  })
    .index("by_organization", ["organizationId"])
    .index("by_email", ["email"])
    .index("by_clerk_id", ["userId"])
    .index("by_org_and_clerk", ["organizationId", "userId"]),

  events: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    date: v.string(),
    time: v.string(),
    ministryId: v.optional(v.id("ministries")),
    status: v.optional(v.string()), // "Draft" | "Published"
    rsvpCount: v.number(),
    type: v.optional(v.string()), // e.g., "Worship", "Outreach"
    stage: v.optional(v.string()), // e.g., "Planning", "Ready"
    lead: v.optional(v.string()), // Organizer name
  })
    .index("by_organization", ["organizationId"])
    .index("by_ministry", ["ministryId"])
    .index("by_org_and_date", ["organizationId", "date"]),

  announcements: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    body: v.string(),
    ministryId: v.optional(v.id("ministries")), // Optional for Global
    status: v.optional(v.string()), // "Draft" | "Published"
    createdAt: v.number(),
    date: v.string(), // Display date
  })
    .index("by_organization", ["organizationId"])
    .index("by_ministry", ["ministryId"]),

  attendance: defineTable({
    organizationId: v.id("organizations"),
    memberId: v.id("users"),
    eventId: v.optional(v.id("events")),
    serviceId: v.optional(v.id("services")),
    date: v.string(),
    status: v.union(v.literal("present"), v.literal("absent")),
    markedBy: v.optional(v.id("users")), // Track who marked this attendance (optional for backward compatibility)
  })
    .index("by_organization", ["organizationId"])
    .index("by_member", ["memberId"])
    .index("by_event", ["eventId"])
    .index("by_date", ["date"])
    .index("by_org_and_date", ["organizationId", "date"]),



  prayer_requests: defineTable({
    organizationId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    name: v.string(),
    request: v.string(),
    status: v.string(), // "Open", "Prayed", "Archived"
    ministryId: v.optional(v.id("ministries")),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  rsvps: defineTable({
    organizationId: v.id("organizations"),
    memberId: v.id("users"),
    eventId: v.id("events"),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_member", ["memberId"])
    .index("by_event", ["eventId"]),

  bulletins: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    date: v.string(),
    summary: v.string(),
    status: v.string(), // "Draft", "Published"
    ministryId: v.optional(v.id("ministries")), // Optional if general
    editor: v.optional(v.string()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_ministry", ["ministryId"]),

  services: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    day: v.string(),
    time: v.string(),
    location: v.string(),
  }).index("by_organization", ["organizationId"]),

  giving_options: defineTable({
    organizationId: v.id("organizations"),
    label: v.string(),
    description: v.string(),
    qrCodeUrl: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_organization", ["organizationId"]),

  onboarding_steps: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    order: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_order", ["order"])
    .index("by_org_and_order", ["organizationId", "order"]),

  user_onboarding_progress: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    stepId: v.id("onboarding_steps"),
    completedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_user_step", ["userId", "stepId"]),

  givingTransactions: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"), // Member who gave
    ministryId: v.optional(v.id("ministries")), // Ministry context
    amount: v.number(), // Amount given
    givingType: v.string(), // "Tithe", "Offering", "Pledge", etc.
    date: v.string(), // Transaction date (YYYY-MM-DD)
    notes: v.optional(v.string()), // Optional notes
    recordedBy: v.id("users"), // Finance user who recorded it
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_ministry", ["ministryId"])
    .index("by_recorded_by", ["recordedBy"])
    .index("by_org_and_user", ["organizationId", "userId"]),

  settings: defineTable({
    organizationId: v.id("organizations"),
    inactiveAbsences: v.number(),
    promoteAttendance: v.number(),
    followUpAbsences: v.number(),
    // Dynamic Content
    welcomeTitle: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    vision: v.optional(v.string()),
    mission: v.optional(v.string()),
    aboutChurch: v.optional(v.string()),
    // Branding
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    // Content & Socials
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        x: v.optional(v.string()),
        youtube: v.optional(v.string()),
      })
    ),
    // Configuration
    givingTypes: v.optional(v.array(v.string())),
    address: v.optional(v.string()),
    visitInfo: v.optional(v.string()),
    enabledModules: v.optional(v.array(v.string())),
    typography: v.optional(v.string()),
  }).index("by_organization", ["organizationId"]),

  assignments: defineTable({
    organizationId: v.id("organizations"),
    memberId: v.id("users"),
    ministryId: v.id("ministries"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("acknowledged"), v.literal("not_available")),
    assignedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_member", ["memberId"])
    .index("by_ministry", ["ministryId"])
    .index("by_org_and_member", ["organizationId", "memberId"]),

  albums: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    eventId: v.optional(v.id("events")),
    ministryId: v.optional(v.id("ministries")),
    isGlobal: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_ministry", ["ministryId"])
    .index("by_event", ["eventId"]),

  photos: defineTable({
    organizationId: v.id("organizations"),
    albumId: v.id("albums"),
    storageId: v.id("_storage"),
    url: v.string(),
    caption: v.optional(v.string()),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_album", ["albumId"]),

  reactions: defineTable({
    organizationId: v.id("organizations"),
    photoId: v.id("photos"),
    userId: v.id("users"),
    type: v.string(), // "heart", "smile", etc.
  })
    .index("by_organization", ["organizationId"])
    .index("by_photo", ["photoId"]),

  comments: defineTable({
    organizationId: v.id("organizations"),
    photoId: v.id("photos"),
    userId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_photo", ["photoId"]),

  audit_logs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    traceId: v.string(),
    spanId: v.optional(v.string()),
    level: v.union(v.literal("INFO"), v.literal("WARN"), v.literal("ERROR"), v.literal("DEBUG")),
    action: v.string(), // e.g., "ALBUM_CREATE", "PHOTO_DELETE"
    resourceType: v.string(), // e.g., "media", "assignments"
    resourceId: v.optional(v.string()),
    details: v.string(), // Human readable summary
    metadata: v.optional(v.any()), // Extra context
    duration_ms: v.optional(v.number()),
    status: v.string(), // "success" | "error" | "start"
    timestamp: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_trace", ["traceId"])
    .index("by_action", ["action"])
    .index("by_resource", ["resourceType", "resourceId"]),

  // --- Financial System Tables ---

  funds: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // e.g., "General", "Building", "Missions"
    description: v.optional(v.string()),
    balance: v.number(), // Aggregated balance for convenience
    isActive: v.boolean(),
  }).index("by_organization", ["organizationId"]),

  accounts: defineTable({
    organizationId: v.id("organizations"),
    code: v.string(), // e.g., "1000", "4000"
    name: v.string(), // e.g., "Cash & Bank", "Contributions Revenue"
    type: v.union(
      v.literal("Asset"),
      v.literal("Liability"),
      v.literal("Equity"),
      v.literal("Revenue"),
      v.literal("Expense")
    ),
    description: v.optional(v.string()),
    parentAccountId: v.optional(v.id("accounts")), // For hierarchical COA
    isActive: v.boolean(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_code", ["code"])
    .index("by_organization_and_code", ["organizationId", "code"]),

  ledger_entries: defineTable({
    organizationId: v.id("organizations"),
    fundId: v.id("funds"),
    accountId: v.id("accounts"),
    amount: v.number(), // Positive for debits, negative for credits (or explicit type)
    type: v.union(v.literal("debit"), v.literal("credit")),
    date: v.string(), // YYYY-MM-DD
    description: v.string(),
    reference: v.optional(v.string()), // e.g., Receipt #, Check #
    recordedBy: v.id("users"),
    createdAt: v.number(),
    metadata: v.optional(v.any()), // Extra context (e.g., link to givingTransactionId)
  })
    .index("by_organization", ["organizationId"])
    .index("by_fund", ["fundId"])
    .index("by_account", ["accountId"])
    .index("by_org_and_date", ["organizationId", "date"])
    .index("by_org_and_fund", ["organizationId", "fundId"]),

  expenses: defineTable({
    organizationId: v.id("organizations"),
    description: v.string(),
    amount: v.number(),
    fundId: v.id("funds"),
    accountId: v.id("accounts"), // Category
    submitterId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    date: v.string(), // YYYY-MM-DD
    approvedBy: v.optional(v.id("users")),
    ledgerEntryId: v.optional(v.id("ledger_entries")), // Set when approved
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_org_and_status", ["organizationId", "status"]),

  budgets: defineTable({
    organizationId: v.id("organizations"),
    fundId: v.id("funds"),
    accountId: v.id("accounts"),
    amount: v.number(), // Budgeted amount
    period: v.string(), // e.g., "2026-02"
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_org_and_period", ["organizationId", "period"])
    .index("by_org_fund_account", ["organizationId", "fundId", "accountId"]),

  // Follow-up assignments: tracks which leader is assigned to follow up a member
  follow_up_assignments: defineTable({
    organizationId: v.id("organizations"),
    memberId: v.id("users"),       // The member needing follow-up
    leaderId: v.id("users"),       // The leader assigned
    assignedBy: v.id("users"),     // Who made the assignment
    notes: v.optional(v.string()), // Optional pastoral notes from admin
    leaderNotes: v.optional(v.string()), // Notes added by the assigned leader after follow-up
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
    createdAt: v.number(),
    notifiedAt: v.optional(v.number()), // Reserved for future email notification
  })
    .index("by_organization", ["organizationId"])
    .index("by_member", ["memberId"])
    .index("by_leader", ["leaderId"])
    .index("by_org_and_member", ["organizationId", "memberId"]),
  
  // Bible Reading System
  bible_reading_plans: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(), // Total number of days
    externalLink: v.optional(v.string()), // Reference to your other bible app
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  bible_reading_plan_days: defineTable({
    planId: v.id("bible_reading_plans"),
    dayNumber: v.number(),
    scripture: v.string(),
    notes: v.optional(v.string()),
  }).index("by_plan", ["planId"])
    .index("by_plan_and_day", ["planId", "dayNumber"]),

  bible_reading_assignments: defineTable({
    organizationId: v.id("organizations"),
    planId: v.id("bible_reading_plans"),
    memberId: v.id("users"),
    startDate: v.string(), // YYYY-MM-DD
    status: v.union(v.literal("active"), v.literal("completed")),
    assignedBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"])
    .index("by_member", ["memberId"])
    .index("by_plan", ["planId"])
    .index("by_org_and_member", ["organizationId", "memberId"]),

  bible_reading_progress: defineTable({
    organizationId: v.id("organizations"),
    assignmentId: v.id("bible_reading_assignments"),
    dayNumber: v.number(),
    completedAt: v.number(),
  }).index("by_organization", ["organizationId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_assignment_and_day", ["assignmentId", "dayNumber"]),
});


