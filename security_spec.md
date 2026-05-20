# Security Specification - Barbershop Management System

## Data Invariants
1. Services, Appointments, Customers, and Notifications must belong to a valid Barbershop.
2. Users have a `barbershopId` that determines which barbershop data they can access.
3. Appointments must have a valid `userId` (barber) and `serviceId`.
4. Customers are scoped to a barbershop and identified by phone.
5. Critical fields like `createdAt` are immutable.
6. Status transitions for appointments must be valid (e.g., from pending to confirmed).

## The Dirty Dozen Payloads
1. **Unauthorized Barbershop Creation**: A user trying to create a barbershop with an ID they don't own or without being logged in.
2. **Accessing Other Shop's Appointments**: A user from Shop A trying to read appointments from Shop B.
3. **Malicious Service Price**: Setting a service price to a negative value or a non-numeric string.
4. **Appointment Hijacking**: Changing the `barbershopId` of an existing appointment to move it to another shop.
5. **Unauthorized User Elevation**: A barber trying to change their own role to 'admin'.
6. **Immutable Field Tampering**: Trying to update `createdAt` on any document.
7. **Customer Data Leak**: An unauthenticated user trying to list all customers.
8. **Invalid Status Transition**: Manually setting an appointment status to 'completed' without it being 'confirmed' first (if such logic is enforced).
9. **Large String Injection**: Trying to inject a 1MB string into a customer's name.
10. **Orphaned Appointment**: Creating an appointment for a barbershop that doesn't exist.
11. **Notification Spoofing**: A user creating notifications for a shop they don't belong to.
12. **Self-Subscription Activation**: A user trying to set their barbershop's `subscriptionStatus` to 'active' manually.

## Test Runner (Verifying PERMISSION_DENIED)
We will use `firestore.rules.test.ts` to verify these cases.
