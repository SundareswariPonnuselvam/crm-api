# CRM API

A simple Customer Relationship Management (CRM) API built with Node.js, Express, and MongoDB.

## Features

- User authentication (signup/login)
- Contact management (create, read, update, delete)
- Organization management
- Role-based access control

## API Endpoints

### Authentication

| Method | Endpoint           | Description                      |
|--------|--------------------|----------------------------------|
| POST   | `/api/auth/signup` | Register a new user              |
| POST   | `/api/auth/login`  | Login an existing user           |
| GET    | `/api/auth/me`     | Get current user details (protected) |

### Contacts

| Method | Endpoint          | Description                      |
|--------|-------------------|----------------------------------|
| GET    | `/api/contacts`   | Get all contacts (protected)     |
| POST   | `/api/contacts`   | Create a new contact (protected) |
| GET    | `/api/contacts/:id` | Get a single contact (protected) |
| PUT    | `/api/contacts/:id` | Update a contact (protected)     |
| DELETE | `/api/contacts/:id` | Delete a contact (protected)     |

### Organizations

| Method | Endpoint             | Description                      |
|--------|----------------------|----------------------------------|
| GET    | `/api/organizations` | Get all organizations (protected) |
| POST   | `/api/organizations` | Create new organization (protected) |
| GET    | `/api/organizations/:id` | Get single organization (protected) |
| PUT    | `/api/organizations/:id` | Update organization (protected)  |
| DELETE | `/api/organizations/:id` | Delete organization (protected)  |

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local instance or MongoDB Atlas)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sabaree-88/crm-api.git
cd crm-api
```
2. Install dependencies:
```bash
npm install
# or
yarn install
```
