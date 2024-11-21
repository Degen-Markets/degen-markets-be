ALTER TABLE "boxes" ADD COLUMN "isOpened" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "boxes" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "boxes" ADD COLUMN "openedAt" timestamp;--> statement-breakpoint
ALTER TABLE "boxes" ADD COLUMN "winningToken" varchar(44);--> statement-breakpoint
ALTER TABLE "boxes" ADD COLUMN "winningAmount" integer;--> statement-breakpoint
ALTER TABLE "boxes" DROP COLUMN IF EXISTS "is_opened";--> statement-breakpoint
ALTER TABLE "boxes" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "boxes" DROP COLUMN IF EXISTS "opened_at";--> statement-breakpoint
ALTER TABLE "boxes" DROP COLUMN IF EXISTS "winning_token";--> statement-breakpoint
ALTER TABLE "boxes" DROP COLUMN IF EXISTS "winning_amount";