# 🛠️ Campus Pages Admin

<div align="center">

### Administrative Dashboard for Campus Pages

Manage users, content, academic resources, platform activity, and system operations from a centralized web dashboard.

![Status](https://img.shields.io/badge/Status-Active%20Development-success)
![Firebase](https://img.shields.io/badge/Backend-Firebase-yellow)
![Dashboard](https://img.shields.io/badge/Platform-Web-blue)

</div>

---

## ✨ Overview

Campus Pages Admin is the internal administration portal used to manage the Campus Pages ecosystem.

The dashboard provides moderation tools, content management capabilities, analytics, and platform monitoring functionality.

---

## 🎯 Core Responsibilities

### 📚 Content Management

* Review uploaded resources
* Manage PDFs and study materials
* Organize subject categories
* Moderate user-generated content
* Handle reported resources

### 👥 User Management

* Monitor contributor activity
* Manage user accounts
* Review user statistics
* Track platform engagement

### 📊 Analytics & Monitoring

* Upload statistics
* View analytics
* Download analytics
* Contributor insights
* Platform growth tracking

### ⚙️ Platform Administration

* Manage featured content
* Configure announcements
* Control platform visibility
* Monitor system health

---

## 🏗️ Project Structure

```text
src/
├── components/
├── pages/
├── services/
├── hooks/
├── utils/
├── firebase/
└── assets/
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js (Latest LTS)
* npm
* Git

### Installation

```bash
git clone https://github.com/<owner>/<repository>.git
cd NotesSharingAdmin
npm install
```

### Run Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

---

## 🔥 Backend Services

The dashboard integrates with:

* Firebase Authentication
* Cloud Firestore
* Firebase Storage
* Firebase Functions

---

## 🌿 Branch Strategy

### Branches

```text
main      → Production / Stable
pratyush  → Development Branch
apoorva   → Development Branch
```

### Rules

✅ Develop only on your branch

✅ Test before merging

✅ Keep main stable

✅ Use Pull Requests

❌ Do not commit directly to main

❌ Do not force push to main

❌ Do not merge untested code

---

## 🔄 Daily Development Workflow

### 1. Switch To Your Branch

```bash
git checkout pratyush
```

or

```bash
git checkout apoorva
```

---

### 2. Pull Latest Changes

```bash
git pull
```

---

### 3. Make Changes

After completing work:

```bash
git add .
git commit -m "Describe your changes"
git push
```

---

### 4. Create Pull Request

```text
Base Branch: main
Compare Branch: your_branch
```

Review changes and merge only after testing.

---

## 📈 Development Status

🟢 Active Development

The dashboard is actively evolving alongside the Campus Pages Android application.

New moderation tools, analytics features, and management capabilities are continuously being added.

---

## 🔒 Internal Project Notice

This repository is publicly visible for portfolio and showcase purposes.

The dashboard itself is intended for internal administrative use only.

External contributions, redistribution, modification, or commercial use are not authorized without explicit permission from the project maintainers.

---

## 📄 License

No open-source license has been applied to this repository.

All rights reserved.

Viewing the source code does not grant permission to copy, modify, redistribute, or commercially use any part of this project.

---

<div align="center">

Built for managing the Campus Pages ecosystem.

</div>
