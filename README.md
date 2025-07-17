# DevBoard – Full‑Stack Productivity & Collaboration Dashboard

**DevBoard** is a developer‑focused productivity and collaboration platform built with **Angular**, **Node.js**, **Express** and **MongoDB**. It provides an integrated workspace for managing projects, tasks, journal entries, Pomodoro sessions and analytics in one responsive, themeable application.

---

## Table of Contents

1. [Features](#features)  
2. [Technology Stack](#technology-stack)  
3. [Project Structure](#project-structure)  
4. [Getting Started](#getting-started)  
   1. [Prerequisites](#prerequisites)  
   2. [Backend Setup](#backend-setup)  
   3. [Frontend Setup](#frontend-setup)  
5. [Usage](#usage)  
6. [Future Improvements](#future-improvements)  
7. [Contributing](#contributing)  
8. [License](#license)  

---

## Features

- **User Authentication**  
  JWT‑based login and registration with route guards  
- **Project Management**  
  Create, edit and delete projects; assign color tags and deadlines  
- **Task Manager**  
  Kanban‑style task board with drag‑and‑drop, subtasks and priority levels  
- **Daily Journal**  
  Markdown‑enabled entries with mood and productivity ratings  
- **Pomodoro Timer**  
  Focus session tracking with persistent session history  
- **Analytics Dashboard**  
  Interactive charts powered by `ngx‑charts` for tasks and time data  
- **Theme Toggle**  
  Dark/light mode switching with user‑stored preference  
- **Notifications & Quick Actions**  
  In‑app alerts and keyboard shortcuts for productivity  

---

## Technology Stack

| Layer        | Technology              |
| ------------ | ----------------------- |
| Frontend     | Angular, SCSS, ngx‑charts |
| Backend      | Node.js, Express.js     |
| Database     | MongoDB, Mongoose       |
| Authentication | JSON Web Tokens (JWT) |
| Tools        | Git, Postman, MongoDB Compass |

---

## Project Structure

DevBoard/
├── backend/
│ ├── controllers/ # Express route handlers
│ ├── middleware/ # Authentication, error handling
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API endpoint definitions
│ ├── .env # Environment variables
│ └── server.js # Entry point
├── src/ # Angular application
│ ├── app/
│ │ ├── auth/ # Login, registration modules
│ │ ├── dashboard/ # Layout and navigation
│ │ ├── projects/ # Project list/details
│ │ ├── tasks/ # Task board
│ │ ├── journal/ # Journal entries
│ │ ├── pomodoro/ # Timer component
│ │ └── shared/ # Services, guards, models
│ ├── assets/ # Images, styles, icons
│ └── index.html
├── angular.json
├── package.json # Frontend dependencies
└── README.md # This file

### Prerequisites

- [Node.js (v14+)](https://nodejs.org/)  
- [Angular CLI](https://angular.io/cli)  
- [MongoDB (local or Atlas)](https://www.mongodb.com/)  
