# Local Development Tutorial

Follow this guided path to run the User Flow Library locally.

## 1. Install dependencies

```bash
pnpm install
```

## 2. Configure Supabase

Populate `.env.local` with the project keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jrhnlbilfozzrdphcvxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Create database tables

Run `sql/CREATE_FLOW_TABLES.sql` in the Supabase SQL Editor (`https://supabase.com/dashboard/project/jrhnlbilfozzrdphcvxp/sql/new`).

This script creates:

- `projects` – apps/products
- `flows` – user flows within projects
- `screens` – hierarchical screen nodes
- Triggers that maintain counts and materialised paths

## 4. Create storage bucket

Execute `sql/CREATE_STORAGE_BUCKET.sql` in the Supabase SQL Editor. This provisions the `screenshots` bucket and the public policies needed for uploads.

## 5. Optional: configure AI hotspot detection

### Option A: GPT-4 Vision (default)

Add the OpenAI key to `.env.local`:

```env
OPENAI_API_KEY=your-openai-api-key
```

### Option B: UIED service (recommended for accuracy)

```bash
cd python-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

Update `.env.local`:

```env
UIED_SERVICE_URL=http://localhost:5000
OPENAI_API_KEY=your-openai-api-key
```

Refer to `python-service/SETUP.md` for more details.

## 6. Start the app

```bash
pnpm run dev
```

Open the app at `http://localhost:3000`.
