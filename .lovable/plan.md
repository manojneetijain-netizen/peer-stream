

# Pulse — Decentralized-Inspired Social Media Platform

## Overview
A premium social media platform with an Apple-level cinematic landing page and a fully functional social app behind it. The entire experience uses a dark, Web3-inspired aesthetic with deep blacks, electric blue accents, and glassmorphism effects.

---

## Part 1: Landing Page (Scrollytelling Experience)

### Navigation Bar
- Sticky glassmorphism navbar: transparent → frosted glass on scroll
- Logo "Pulse" on left, nav links center, "Get Pulse" CTA button right
- Gradient accent border (blue → cyan)

### Scroll Sections (CSS/Framer Motion animations)
1. **Hero** — Large "Pulse" headline with subtitle, CSS-built phone mockup floating with subtle glow animation
2. **Architecture** — Phone UI elements animate apart into floating cards (feed, chat, profiles) as user scrolls, with performance-focused copy
3. **Real-Time** — Animated message bubbles, reaction icons, and notification badges pulse and travel between floating elements
4. **AI & Discovery** — Glowing recommendation nodes and content cards reorganize dynamically
5. **Security** — Encryption shields and lock icons wrap around the device with privacy-focused copy
6. **CTA** — Elements reassemble, final polished phone state, "Get Pulse" and "See Features" buttons

### Visual Effects
- Scroll-triggered opacity, transform, and scale animations
- Radial gradient glows behind key elements
- Gradient borders on cards and buttons (#0050FF → #00D6FF)
- Smooth parallax layering

---

## Part 2: Authentication

- Dedicated `/auth` page with login and signup tabs
- Email/password authentication via Supabase Auth
- Dark themed auth UI matching the Web3 aesthetic
- Auto-redirect authenticated users to the main app
- Profiles table storing username, display name, avatar URL, and bio

---

## Part 3: Social Media App

### User Profiles
- Profile page with avatar, bio, post count, follower/following counts
- Edit profile functionality
- Avatar upload via Supabase Storage
- View other users' profiles

### Posts & Feed
- Create posts with text and optional image uploads
- Home feed showing posts from followed users
- Discover/explore feed showing trending or recent posts
- Post timestamps and author info

### Likes & Comments
- Like/unlike posts with real-time count updates
- Comment on posts with threaded display
- Like count and comment count visible on each post

### Follows
- Follow/unfollow users from their profile
- Follower and following counts
- Feed filtered to show followed users' content

### Notifications
- Real-time notifications for new likes, comments, and follows
- Notification bell with unread count
- Notification list page

---

## Part 4: Database Design (Supabase)

- **profiles** — user_id, username, display_name, avatar_url, bio
- **posts** — id, user_id, content, image_url, created_at
- **likes** — id, user_id, post_id
- **comments** — id, user_id, post_id, content, created_at
- **follows** — id, follower_id, following_id
- **notifications** — id, user_id, type, reference_id, read, created_at
- Supabase Storage bucket for avatars and post images
- RLS policies on all tables

---

## Design System
- **Background:** #050505 / #0A0A0C
- **Accent:** #0050FF → #00D6FF gradient
- **Typography:** Clean, tight, editorial headlines; Inter-style font
- **UI:** Glassmorphism cards, gradient borders, soft glows, dark mode throughout
- **Consistent aesthetic** from landing page through the entire app

