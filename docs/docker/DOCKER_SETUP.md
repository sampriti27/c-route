# C.Route Frontend — Docker Setup

## Prerequisites
- Docker Desktop installed and running
- Your existing repo at e.g. `~/croute-hackathon/`

---

## Step 1 — Scaffold the Next.js project (ONE TIME)

Run this from your repo root (e.g. `~/croute-hackathon/`):

```bash
docker run --rm -it \
  -v "$(pwd)":/workspace \
  -w /workspace \
  node:20-alpine \
  sh -c "npx create-next-app@latest croute-frontend \
    --typescript \
    --tailwind \
    --app \
    --src-dir \
    --import-alias '@/*' \
    --no-git \
    --yes"
```

This creates `croute-frontend/` with all the base files.

---

## Step 2 — Add the C.Route config files

Copy the files from this folder into the right places:

```bash
# From this docker-setup/ folder:

cp Dockerfile.dev      ../croute-frontend/Dockerfile.dev
cp Dockerfile          ../croute-frontend/Dockerfile
cp .dockerignore       ../croute-frontend/.dockerignore
cp next.config.ts      ../croute-frontend/next.config.ts
cp tailwind.config.ts  ../croute-frontend/tailwind.config.ts
cp docker-compose.yml  ../docker-compose.yml       # ← repo root, NOT inside croute-frontend
cp globals.css         ../croute-frontend/src/app/globals.css  # replaces the default
```

---

## Step 3 — Start development

From your repo root:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- First build takes ~60–90 sec (npm install inside container)
- After that, file changes in `src/` hot-reload instantly

To stop: `Ctrl+C` then `docker compose down`

---

## Step 4 — Add shadcn/ui components (ONE TIME, after container is running)

Open a second terminal and run:

```bash
# Init shadcn inside the running container
docker exec -it croute-frontend npx shadcn@latest init --yes --defaults

# Add the components you need
docker exec -it croute-frontend npx shadcn@latest add button card badge progress separator textarea
```

These commands write component files into your `src/components/ui/` folder
(which is mounted, so the files appear on your host too).

---

## Step 5 — Add extra packages (axios, lucide-react, framer-motion)

```bash
docker exec -it croute-frontend npm install axios lucide-react framer-motion
```

This updates package.json and node_modules inside the container.
The package.json change appears in your mounted src (if you mount it).

**Tip:** After adding packages, commit the updated package.json + package-lock.json
so the next `docker compose up --build` includes them.

---

## Day-to-day workflow

```bash
# Start
docker compose up

# Stop
docker compose down

# Add a new package
docker exec -it croute-frontend npm install <package>

# Add a shadcn component
docker exec -it croute-frontend npx shadcn@latest add <component>

# Rebuild from scratch (e.g. after package.json changes)
docker compose up --build
```

---

## Production build (Cloud Run)

From `croute-frontend/`:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://your-backend-url \
  -t croute-frontend:prod \
  .
```

The production Dockerfile uses `output: "standalone"` (set in next.config.ts),
which emits a minimal self-contained server — ideal for Cloud Run.

---

## Folder structure after setup

```
croute-hackathon/
├── backend/
├── data/
├── docker-compose.yml          ← dev orchestration
└── croute-frontend/
    ├── Dockerfile.dev          ← dev image
    ├── Dockerfile              ← prod image (Cloud Run)
    ├── .dockerignore
    ├── next.config.ts          ← output: standalone
    ├── tailwind.config.ts      ← C.Route brand tokens
    ├── package.json
    └── src/
        ├── app/
        │   ├── globals.css     ← C.Route CSS tokens + Google Fonts
        │   ├── layout.tsx
        │   └── page.tsx
        └── components/
            └── ui/             ← shadcn components land here
```
