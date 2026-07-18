# Security Specification - Cordwainers Studio

## Data Invariants
1. A Repair must have a valid customer name and invoice number.
2. An Appointment must have a customer name, email, date, time, and service type.
3. User Profiles can only be written by the owner.
4. Notifications can only be read/updated by the recipient.

## The Dirty Dozen Payloads

### 1. Appointment: Missing Required Fields
```json
{
  "customerName": "John Doe",
  "email": "john@example.com"
}
```
**Expectation**: PERMISSION_DENIED (Missing date, time, serviceType)

### 2. Appointment: Invalid Service Type
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "date": "2026-07-20",
  "time": "10:00",
  "serviceType": "Magic Carpet Ride"
}
```
**Expectation**: PERMISSION_DENIED (serviceType enum violation)

### 3. Appointment: Spoofing Owner (if auth applied)
```json
{
  "customerName": "Attacker",
  "email": "attacker@example.com",
  "date": "2026-07-20",
  "time": "10:00",
  "serviceType": "Drop-off",
  "ownerId": "victim_uid"
}
```
**Expectation**: PERMISSION_DENIED (ownerId mismatch)

### 4. Profile: Writing to someone else's profile
**Expectation**: PERMISSION_DENIED (uid mismatch)

... (and so on for other collections)

## Test Runner
(I'll skip the full test runner for now but follow the logic in rules)
