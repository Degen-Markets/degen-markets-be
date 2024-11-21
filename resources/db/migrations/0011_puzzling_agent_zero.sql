ALTER TABLE "boxes" ALTER COLUMN "winningAmount" SET DATA TYPE numeric(50, 0);--> statement-breakpoint
ALTER TABLE "boxes" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;