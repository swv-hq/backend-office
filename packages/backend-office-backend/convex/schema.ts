import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { addressValidator, lineItemValidator } from "./lib/validators";

export default defineSchema({
  contractors: defineTable({
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    businessName: v.string(),
    phone: v.string(),
    tradeType: v.union(
      v.literal("handyman"),
      v.literal("plumber"),
      v.literal("electrician"),
    ),
    zipCode: v.string(),
    stripeAccountId: v.optional(v.string()),
    stripeAccountType: v.optional(v.string()),
    calendarProvider: v.optional(
      v.union(v.literal("google"), v.literal("apple"), v.literal("in_app")),
    ),
    twilioPhoneNumber: v.optional(v.string()),
    forwardingConfigured: v.optional(v.boolean()),
    logoFileId: v.optional(v.id("_storage")),
    onboardingCompleted: v.boolean(),
    nextJobNumber: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  contacts: defineTable({
    contractorId: v.id("contractors"),
    phone: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(addressValidator),
    source: v.union(
      v.literal("missed_call"),
      v.literal("manual"),
      v.literal("voicemail"),
      v.literal("sms"),
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contractorId", ["contractorId"])
    .index("by_contractorId_phone", ["contractorId", "phone"]),

  jobs: defineTable({
    contractorId: v.id("contractors"),
    contactId: v.optional(v.id("contacts")),
    jobNumber: v.number(),
    // Denormalized cache; source of truth is convex/lib/jobStatus.ts -> computeJobRollup.
    // Any mutation that creates/updates segments or invoices must call the helper and
    // write the result back atomically. Never set this field directly from a use case.
    status: v.union(
      v.literal("lead"),
      v.literal("estimated"),
      v.literal("approved"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("paid"),
    ),
    description: v.optional(v.string()),
    address: v.optional(addressValidator),
    nextEstimateVersion: v.number(),
    nextInvoiceSequence: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contractorId", ["contractorId"])
    .index("by_contactId", ["contactId"])
    .index("by_status", ["status"])
    .index("by_contractorId_jobNumber", ["contractorId", "jobNumber"]),

  jobSegments: defineTable({
    jobId: v.id("jobs"),
    contractorId: v.id("contractors"),
    sequence: v.number(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("canceled"),
    ),
    scheduledAt: v.optional(v.number()),
    scheduledDuration: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jobId", ["jobId"])
    .index("by_contractorId", ["contractorId"])
    .index("by_contractorId_scheduledAt", ["contractorId", "scheduledAt"])
    .index("by_contractorId_status", ["contractorId", "status"]),

  estimates: defineTable({
    jobId: v.id("jobs"),
    contractorId: v.id("contractors"),
    estimateNumber: v.string(),
    version: v.number(),
    lineItems: v.array(lineItemValidator),
    total: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("finalized"),
      v.literal("sent"),
      v.literal("approved"),
      v.literal("declined"),
    ),
    changeNotes: v.optional(v.string()),
    conversationHistory: v.optional(v.array(v.any())),
    sentAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    declinedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_jobId", ["jobId"])
    .index("by_contractorId", ["contractorId"]),

  invoices: defineTable({
    jobId: v.id("jobs"),
    contractorId: v.id("contractors"),
    estimateId: v.id("estimates"),
    invoiceNumber: v.string(),
    invoiceType: v.union(
      v.literal("deposit"),
      v.literal("progress"),
      v.literal("final"),
    ),
    segmentIds: v.array(v.id("jobSegments")),
    creditedDepositInvoiceIds: v.array(v.id("invoices")),
    lineItems: v.array(lineItemValidator),
    total: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
    ),
    paidAt: v.optional(v.number()),
    stripePaymentId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_jobId", ["jobId"])
    .index("by_contractorId", ["contractorId"])
    .index("by_status", ["status"]),

  callLogs: defineTable({
    contractorId: v.id("contractors"),
    contactId: v.optional(v.id("contacts")),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    callerPhone: v.string(),
    status: v.union(
      v.literal("missed"),
      v.literal("answered"),
      v.literal("voicemail"),
    ),
    voicemailUrl: v.optional(v.string()),
    voicemailFileId: v.optional(v.id("_storage")),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    callbackStatus: v.union(
      v.literal("pending"),
      v.literal("reminded"),
      v.literal("completed"),
    ),
    twilioCallSid: v.optional(v.string()),
    duration: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_contractorId", ["contractorId"])
    .index("by_contactId", ["contactId"])
    .index("by_callbackStatus", ["callbackStatus"]),

  accessTokens: defineTable({
    entityType: v.string(),
    entityId: v.string(),
    token: v.string(),
    expiresAt: v.optional(v.number()),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_entityType_entityId", ["entityType", "entityId"]),
});
