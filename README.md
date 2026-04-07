# QuizMaster Django - Local + Vercel Guide

This project is configured with:
- Django 4.2.7
- SQLite for local/dev data
- Database-seeded quiz questions
- Vercel serverless entrypoint for deployment

## Local setup

### 1) Install dependencies

```bash
pip install -r requirements.txt
```

### 2) Apply migrations

```bash
python manage.py migrate
```

### 3) Seed quiz questions

```bash
python manage.py seed_questions
```

### 4) Run locally

```bash
python manage.py runserver
```

## Vercel deployment

### Files already added for deployment

- `api/index.py` (serverless WSGI entry)
- `vercel.json` (routes + Python runtime)

### 1) Push your code to GitHub

Commit and push this project to a GitHub repo.

### 2) Import project in Vercel

- Open Vercel dashboard
- `Add New` -> `Project`
- Import your GitHub repo

### 3) Set environment variables in Vercel

Add these in Project Settings -> Environment Variables:

- `SECRET_KEY` = any long random string
- `DEBUG` = `False`
- `ALLOWED_HOSTS` = `.vercel.app,127.0.0.1,localhost`

### 4) Deploy

Click deploy. Vercel will use `vercel.json` and run Django through `api/index.py`.

## Important notes about SQLite on Vercel

- Vercel serverless runtime filesystem is read-only at request time.
- This app uses signed-cookie sessions on Vercel to avoid writing session rows into SQLite.
- SQLite data bundled during build is effectively read-only in production.

If you need persistent writes (new users, quiz attempts saved server-side, admin edits), move production DB to a managed database (Postgres/MySQL).

## Routes

- `/` Home
- `/auth/` Auth page
- `/quiz/` Quiz page
- `/dashboard/` Dashboard
- `/result/` Result page
- `/api/quiz/<slug>/questions/` Quiz questions API
- `/admin/` Django admin
