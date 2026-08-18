# EliteBNB Frontend Team Guide

EliteBNB is a team-built accommodation booking web application with
three frontend sections: **USER**, **HOST**, and **ADMIN**. This guide
keeps everyone working with the same structure, theme, reusable
components, and Git workflow.

## Design System

Use the approved EliteBNB dashboard mockup as the main UI reference.
EliteBNB is a **web app**, not a traditional marketing website, and
should not copy Airbnb exactly.

  Purpose          Value
  ---------------- --------------------------
  Primary          Deep Navy `#172554`
  Secondary        Champagne Gold `#D4A72C`
  Background       Warm Ivory `#FAF9F6`
  Surface          White `#FFFFFF`
  Primary Text     Charcoal `#111827`
  Secondary Text   Slate `#64748B`
  Success          Emerald `#16A34A`
  Error            Red `#DC2626`
  Heading Font     Manrope
  Body/UI Font     Inter

## Project Structure

``` text
src/
├── assets/
├── components/
│   ├── common/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   ├── property/
│   ├── booking/
│   └── dashboard/
├── pages/
│   ├── user/
│   ├── host/
│   ├── admin/
│   └── auth/
├── layouts/
├── context/
├── hooks/
├── services/
├── routes/
├── theme/
├── styles/
├── App.jsx
└── main.jsx
```

Do not create duplicate reusable components inside USER, HOST, or ADMIN.
Check `src/components` first.

## Shared Layout

All dashboards use the same overall structure: deep-navy Sidebar on the
left and a clean white Navbar/content area on the right.

The approved Navbar contains only the menu button on the left and
notification, avatar, `Hi, [Name]`, optional role, and dropdown arrow on
the right. Page headings belong **below** the Navbar.

The Sidebar uses Deep Navy, white/light navigation items, Champagne Gold
for the active item, EliteBNB branding at the top, and Logout at the
bottom. The reusable Sidebar changes menu items based on role.

## USER Section

The USER experience is for customers searching for and booking stays.

-   **Home:** search form, stays/experiences/places tabs, recommended
    properties, upcoming trip, categories.
-   **Explore:** browse, search and filter available properties.
-   **Trips:** upcoming and previous bookings with statuses/details.
-   **Wishlist:** saved properties.
-   **Messages:** conversations with hosts.
-   **Reviews:** submitted and eligible reviews.
-   **Profile:** personal/contact information and avatar.
-   **Settings:** account preferences and security.

## HOST Section

The HOST experience is for property owners.

-   **Dashboard:** total earnings, upcoming bookings, occupancy rate,
    views, bookings, earnings overview, listing performance and
    listings.
-   **Listings:** create, view, edit and manage listings.
-   **Calendar:** availability, reserved dates and blocked dates.
-   **Reservations:** reservations, guest information and statuses.
-   **Earnings:** revenue and property performance.
-   **Messages:** conversations with guests.
-   **Reviews:** listing reviews.
-   **Profile:** host information.
-   **Settings:** account/host preferences.

## ADMIN Section

The ADMIN experience manages the platform.

-   **Dashboard:** total users, hosts, listings and bookings; platform
    chart; booking statuses; top locations; recent bookings.
-   **Users:** search, view and manage users.
-   **Hosts:** host information and activity.
-   **Listings:** platform listing management.
-   **Bookings:** booking records and statuses.
-   **Payments:** transaction/payment records.
-   **Reviews:** platform review management.
-   **Reports:** reports and platform issues.
-   **Settings:** administrative settings.

## Reusable Components

Prefer shared components such as `Button`, `Input`, `TextArea`,
`Select`, `Modal`, `Badge`, `Avatar`, `Card`, `Loader`, `Alert`,
`Navbar`, `Sidebar`, `PropertyCard`, `PropertyGrid`, `BookingCard`,
`BookingSummary`, `StatCard`, `DataTable`, and `ChartCard`.

Use props for variations instead of duplicating components.

``` jsx
<Button variant="primary">Book now</Button>
<Button variant="secondary">Cancel</Button>
```

## Running the Frontend

After cloning or pulling:

``` bash
npm install
npm run dev
```

Vite normally provides a local address such as `http://localhost:5173`.

Common dependencies include:

``` bash
npm install react-router-dom axios lucide-react
```

If they already exist in `package.json`, `npm install` is enough.

## Git Team Workflow

Recommended branch structure:

``` text
main
develop
feature/user-ui
feature/host-ui
feature/admin-ui
```

Before starting new work:

``` bash
git checkout develop
git pull
```

Work on your assigned feature branch. Example:

``` bash
git checkout -b feature/host-ui
```

After completing a meaningful change:

``` bash
git add .
git commit -m "Build host dashboard UI"
git push -u origin feature/host-ui
```

Create a Pull Request for review before merging. Avoid directly changing
another teammate's assigned pages unless the team agrees.

## Backend Integration

The frontend communicates with the EliteBNB Spring Boot backend through
APIs. Keep requests inside the service layer rather than scattering
Axios calls through components.

``` text
src/services/
├── api.js
├── authService.js
├── propertyService.js
├── bookingService.js
└── userService.js
```

Use environment configuration for API base URLs. Never commit database
passwords, API secrets, tokens, or private environment variables.

## Team Rules

1.  Follow the approved EliteBNB theme and mockup.
2.  Use **Manrope** for headings and **Inter** for other UI text.
3.  Reuse shared components instead of duplicating them.
4.  Keep USER, HOST and ADMIN visually consistent.
5.  Do not copy Airbnb exactly.
6.  Keep pages responsive.
7.  Do not commit `node_modules`.
8.  Do not commit secrets or credentials.
9.  Pull team changes regularly to reduce merge conflicts.
10. Use clear commit messages.
11. Do not redesign shared components without coordinating with the
    team.
12. Test your section before opening a Pull Request.

## Before Marking Your Section Complete

Check that the page runs without console errors, navigation works,
shared Navbar/Sidebar are reused, colors/fonts match, layouts are
responsive, no duplicate components or secrets were added, and your
changes are committed and pushed.

------------------------------------------------------------------------

# EliteBNB

**USER • HOST • ADMIN**

Build your assigned section independently, but make the final product
feel like **one application built by one team**.
