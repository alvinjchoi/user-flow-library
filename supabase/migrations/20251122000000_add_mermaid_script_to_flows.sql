-- Add mermaid_script column to flows table
ALTER TABLE "public"."flows"
ADD COLUMN "mermaid_script" TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN "public"."flows"."mermaid_script" IS 'Mermaid flowchart script for visualizing the flow structure';

-- Create an index for faster lookups of flows with mermaid scripts
CREATE INDEX "idx_flows_has_mermaid" ON "public"."flows" USING "btree" ("id") WHERE ("mermaid_script" IS NOT NULL);
