# VERTEX Security Specification

## 1. Data Invariants
- **Users**: Users can only access and update their own profile document (`/users/$(request.auth.uid)`). Users cannot self-escalate their role to `SUPER_ADMIN` or `MANAGER`.
- **Bookings**: A customer can only create bookings where `customerId == request.auth.uid`. A customer can view their own bookings. An assigned technician can view bookings where `technicianId == request.auth.uid`. Admins can view and manage all bookings.
- **Services**: The catalog is read-only for public/authenticated users. Only authorized staff/admins can write service catalog entries.
- **AMC Contracts**: Customers can only read and manage their own contracts where `customerId == request.auth.uid`.
- **Notifications**: Users can only read and mark as read their own notifications where `userId == request.auth.uid`.
- **Admins**: Admin list can only be managed by existing super admins.

## 2. Dirty Dozen Payloads (Targeting Rejection)
1. Unauthenticated write to `/users/{userId}`.
2. User attempting to update someone else's profile at `/users/{otherUserId}`.
3. User attempting to escalate their role by writing `role: "SUPER_ADMIN"`.
4. Customer creating a booking with `customerId` set to another user's UID.
5. Customer updating an arbitrary booking they do not own.
6. Technician attempting to update a booking assigned to a different technician.
7. Unauthenticated read/write to `/amcContracts/{contractId}`.
8. Customer attempting to access notifications belonging to another user.
9. Malicious actor injecting a 10KB string into document ID path variables.
10. Unauthenticated client modifying public services catalog.
11. Regular user creating an entry in `/admins/{adminId}`.
12. Attempting to bypass strict schema validation with unregistered shadow fields.
