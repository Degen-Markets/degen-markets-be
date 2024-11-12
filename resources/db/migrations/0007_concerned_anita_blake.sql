ALTER TABLE "pool_entries" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pool_entries" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;