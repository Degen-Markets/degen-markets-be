CREATE TABLE IF NOT EXISTS "boxes" (
	"is_opened" boolean DEFAULT false NOT NULL,
	"player" varchar(44) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"opened_at" timestamp,
	"winning_token" varchar(44),
	"winning_amount" numeric(18, 9)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_player" ON "boxes" USING btree ("player");