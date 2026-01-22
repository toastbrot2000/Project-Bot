# Backend App (Strapi)

The **Backend App** is the data and content management layer for Project Bot, built with **Strapi**.

## Features

- **Headless CMS**: Manage content for flows, questions, and user data.
- **API**: Provides REST APIs for the frontend applications.
- **Database**: Uses SQLite for local development (fast and simple).

## Integration

This application runs on port `1337` by default.
It is integrated into the monorepo's `pnpm dev` command, so it starts automatically with the other apps.

### Accessing the Admin Panel

Once running, you can access the Strapi Admin Panel at:
[http://localhost:1337/admin](http://localhost:1337/admin)

## Development

You can run this application independently if needed:

```bash
cd apps/backend
pnpm dev
```
