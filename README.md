
# Chisel

> Version control for physical infrastructure.

Chisel brings the principles of version control to the construction and infrastructure industry. Just as Git tracks every change made to software, Chisel maintains a transparent and auditable history of every modification made to physical assets throughout their lifecycle.

From construction projects and maintenance work to infrastructure repairs, Chisel provides a centralized workspace for tracking work, reviewing changes, and maintaining project history.

---
<img width="4695" height="3309" alt="image" src="https://github.com/user-attachments/assets/ae12df91-5b63-4cec-8f70-0feaa4e0487e" />

## What is Chisel?

In traditional construction workflows, project updates are often scattered across spreadsheets, images, reports, and messaging platforms. This makes it difficult to maintain accountability, verify completed work, and understand how a project has evolved over time.

Chisel solves this by treating every piece of work as a reviewable change that becomes a permanent part of a project's history.

Every modification follows a simple workflow:

```text
Issue Created
      ↓
Worker Completes Task
      ↓
Creates a Chisel
      ↓
Maintainer Reviews Changes
      ↓
Approved & Merged
      ↓
Added to Project History
```

---

## Features

- Infrastructure version control.
- Project timeline and change history.
- Issue tracking and task management.
- Worker and maintainer roles.
- Review and approval workflow for completed work.
- Blueprint upload and processing.
- Interactive 3D blueprint visualization.
- Auditable project history.
- Worker portfolios based on completed contributions.
- Real-time project transparency for stakeholders.

---

## Core Concepts

### Projects

A Project represents any physical asset or infrastructure being managed.

Examples:

- Residential Buildings
- Roads
- Bridges
- Schools
- Commercial Complexes
- Maintenance Projects

---

### Issues

Every piece of work begins as an Issue.

Examples:

- Complete electrical wiring.
- Paint the exterior walls.
- Repair water leakage.
- Perform structural inspection.
- Install plumbing.

Issues may be assigned to workers or created independently.

---

### Chisels

A Chisel is a reviewable record of completed work.

It contains:

- Description of completed work.
- Images and supporting media.
- Worker information.
- Timestamped progress updates.
- Verification metadata.

Maintainers can approve or reject submitted Chisels before they become part of the project's permanent history.

---

### Project History

Approved Chisels are merged into the project's timeline, creating a complete and immutable history of all modifications.

```text
Project Created

↓

Blueprint Uploaded

↓

Foundation Completed

↓

Electrical Wiring Completed

↓

Water Leakage Fixed

↓

Roof Installed

↓

Structural Inspection Passed
```

---

## Architecture

Chisel follows a Modular Monolith architecture.

```text
                Client
                   |
                   |
              API Gateway
                   |
------------------------------------------------

    Auth

    Users

    Projects

    Issues

    Chisels

    Blueprints

------------------------------------------------
                   |
                MongoDB
```

---

## Tech Stack

### Frontend

- React js 
- Tailwind CSS
- Three.js

### Backend

- Node.js
- Express.js
- JWT Authentication

### Database

- MongoDB Atlas

### AI & Visualization

- Gemini API
- Three.js
- Blueprint to JSON conversion pipeline

---

## Vision

Our goal is to make Chisel the standard version control platform for physical infrastructure.

Whether it's a small renovation project or a large-scale construction site, every modification should be transparent, reviewable, and permanently recorded.

Software engineers have Git.

Physical infrastructure deserves Chisel.

---

## Getting Started

```bash
# Clone the repository
git clone <repo-url>

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## License

MIT License.

