# 📚 Back.Benchers — JNTUH B.Tech Study Materials & Academic Portal

[![Live Demo](https://img.shields.io/badge/Live%20Site-btech--notes.vercel.app-FACC15?style=for-the-badge&logo=vercel&logoColor=black)](https://btech-notes.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Btech--notes-181717?style=for-the-badge&logo=github)](https://github.com/Narendra2904/Btech-notes)
[![Open Source](https://img.shields.io/badge/License-Open%20Source-22C55E?style=for-the-badge)](#)

> **"SELECT. CLICK. STUDY."**  
> An open-source, zero-login academic resource hub built for **JNTUH (Jawaharlal Nehru Technological University Hyderabad)** B.Tech students to access semester-wise notes, official syllabus copies, results, and study tools in seconds.

---

## 📖 Overview

**Back.Benchers** eliminates the friction of hunting for scattered PDFs across WhatsApp groups and broken links before exams. Built with a fast, lightweight vanilla web architecture and deployed on Vercel, the platform organizes subjects cleanly by **Year → Branch → Semester**, giving students instant access to notes and syllabus materials with no sign-ups or paywalls.

---

## ✨ Key Features

- **⚡ 3-Step Instant Navigation (`Year → Branch → Semester`):**
  - **Years:** 1st Year, 2nd Year, 3rd Year, 4th Year
  - **Branches:** `CSE`, `CSE (AI & ML)`, `CSE (Data Science)`, `CSE (Design)`, `ECE`, `EEE`, `CIVIL`, `MECH`
  - **Semesters:** Semester 1 & Semester 2 with dedicated **Subjects** and **Syllabus** views
- **🤖 Built-in AI Study Assistant (`ai-assistant.js`):** Integrated AI helper to assist students with quick topic explanations, study queries, and navigation.
- **📊 Direct JNTUH Results Integration:** Quick navigation to check semester results directly from the portal (`btech-jntuh-results.vercel.app`).
- **🎬 Student Break / Movie Suggestions (`movie.html`):** Dedicated entertainment recommendation page for post-exam downtime.
- **📱 Android App Support:** Direct APK download modal enabling faster mobile access and offline reading support.
- **🤝 Crowdsourced Notes & Feedback:** Embedded forms allowing students to contribute missing notes (via Google Drive / OneDrive links) or report bugs.
- **🚀 Zero-Login & Lightweight:** Pure client-side catalog rendering (`catalog.json` / `catalog.js`) for near-instant load times even on slow mobile networks.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (`styles.css`), Vanilla JavaScript (`script.js`) |
| **Data & Catalog** | JSON (`catalog.json`), Node.js Catalog Generator (`generate_full_catalog.js`) |
| **AI Module** | Custom JavaScript AI Integration (`ai-assistant.js`) |
| **Hosting & Routing** | Vercel (`vercel.json`) |

---

## 📂 Project Structure

```text
Btech-notes/
├── assets/                    # Static media, banners, and visual assets
├── icons/                     # UI icons and app badges
├── index.html                 # Main academic portal (Year/Branch/Semester selector)
├── movie.html                 # Movie suggestions page for students
├── styles.css                 # Custom responsive dark-mode styling
├── script.js                  # Core UI logic, filtering, and modal handlers
├── ai-assistant.js            # Interactive AI study assistant module
├── catalog.js                 # Client-side catalog loader and renderer
├── catalog.json               # Structured database of branches, semesters, subjects & links
├── generate_full_catalog.js   # Script to build/update the complete subject catalog
├── vercel.json                # Vercel deployment and routing configuration
└── fav.png                    # Site favicon
