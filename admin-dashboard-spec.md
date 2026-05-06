# Admin Dashboard Specification

## User List View
- Dark theme table showing all NoxReach users
- Columns: User (name/email), Status (Pro/Free badge), Health (color-coded), Leads count, Gigs count, Last Active
- Top filters: All/Pro/Free, Active/Inactive, Search
- Stats cards: Total Users, Active Users, Pro Subscribers
- Click user row → opens detail view

## User Detail View
- Header: User name, email, Pro/Free badge, Back button
- 4 Tabs:
  1. Pipeline - Shows user's full lead pipeline (read-only)
  2. Calendar - Shows user's gigs (read-only)
  3. Activity - Timeline of recent actions
  4. Stats - Conversion rates, reply rates, booking metrics

## Health Status Colors
- active: Green
- no_leads_added: Orange
- leads_not_contacted: Yellow  
- replies_no_bookings: Blue
- inactive: Red

## Design Style
- Match NoxReach dark theme (#060608 bg, #6B2FD4 purple accent)
- Clean data table with hover states
- Color-coded health badges
- Stats cards with big numbers
