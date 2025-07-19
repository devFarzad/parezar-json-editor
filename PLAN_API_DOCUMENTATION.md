# Parezar Subscription Plans API Documentation

> **Base URL:** `https://europe-west3-parezar2-2f7ae.cloudfunctions.net/api`

## Table of Contents
- [Data Model](#data-model)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Create Plan](#create-plan)
  - [Get All Plans](#get-all-plans)
  - [Get Plan by ID](#get-plan-by-id)
  - [Update Plan](#update-plan)
  - [Delete Plan](#delete-plan)
- [Testing Examples](#testing-examples)

## Data Model

### Plan Model

```typescript
/**
 * Billing cycle options for a subscription plan
 */
enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL'
}

/**
 * Plan types for different subscription levels
 */
type PlanType = 'basic' | 'standard' | 'premium' | 'enterprise';

/**
 * Feature included in a subscription plan
 */
interface Feature {
  name: string;        // Feature name
  description: string; // Feature description
  limit?: number;      // Optional usage limit
}

/**
 * Subscription plan structure
 */
interface Plan {
  id?: string;         // Unique identifier (assigned by Firestore)
  name: string;        // Plan name (e.g., "Starter", "Professional")
  type?: PlanType;     // Plan type
  description?: string; // Plan description
  price: number;       // Price in IQD
  originalPrice?: number; // Original price if discounted
  currency: 'IQD';     // Currency (always IQD)
  billingCycle: BillingCycle; // Billing frequency
  credits: number;     // Number of credits included
  features: Feature[]; // List of included features
  savingsPercentage?: number; // Savings percentage if discounted
  upgradeBenefits?: string[]; // Additional benefits
  isActive?: boolean;  // Availability status
  createdAt?: Date;    // Creation timestamp
  updatedAt?: Date;    // Last update timestamp
  order?: number;      // Display order
}
```

## Authentication

All admin endpoints (Create, Update, Delete) require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer {{YOUR_FIREBASE_ID_TOKEN}}
```

To get a Firebase ID token for testing:

```bash
curl -X POST 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBt04QiRqu0jKG0iE0sGwSDsVeBuqLdAg8' \
-H 'Content-Type: application/json' \
-d '{
  "email": "your-admin@email.com",
  "password": "your-password",
  "returnSecureToken": true
}'
```

## Endpoints

### Create Plan

Creates a new subscription plan.

**Endpoint:** \`POST /api/plans\`

**Access:** Private (Admin Only)

**Headers:**
```
Authorization: Bearer {{AUTH_TOKEN}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Enterprise Plus",
  "type": "enterprise",
  "description": "Ultimate enterprise solution with unlimited features",
  "price": 200000,
  "currency": "IQD",
  "billingCycle": "annual",
  "credits": 2000,
  "features": [
    {
      "name": "Unlimited API Access",
      "description": "No limits on API calls"
    },
    {
      "name": "Premium Support",
      "description": "24/7 dedicated support line",
      "limit": null
    }
  ],
  "upgradeBenefits": [
    "Priority feature requests",
    "Custom integration support"
  ],
  "order": 5,
  "isActive": true
}
```

**Success Response (201):**
```json
{
  "id": "generated-plan-id",
  "name": "Enterprise Plus",
  "type": "enterprise",
  "description": "Ultimate enterprise solution with unlimited features",
  "price": 200000,
  "currency": "IQD",
  "billingCycle": "annual",
  "credits": 2000,
  "features": [...],
  "upgradeBenefits": [...],
  "order": 5,
  "isActive": true,
  "createdAt": "2025-07-20T12:00:00.000Z",
  "updatedAt": "2025-07-20T12:00:00.000Z"
}
```

### Get All Plans

Retrieves all available subscription plans.

**Endpoint:** \`GET /api/plans\`

**Access:** Public

**Success Response (200):**
```json
[
  {
    "id": "basic-plan",
    "name": "Basic",
    "type": "basic",
    "price": 10000,
    "currency": "IQD",
    "billingCycle": "monthly",
    "credits": 100,
    "features": [...],
    "order": 1
  },
  {
    "id": "standard-plan",
    "name": "Standard",
    "type": "standard",
    "price": 25000,
    "currency": "IQD",
    "billingCycle": "monthly",
    "credits": 300,
    "features": [...],
    "order": 2
  }
]
```

### Get Plan by ID

Retrieves a specific plan by its ID.

**Endpoint:** \`GET /api/plans/:planId\`

**Access:** Public

**Path Parameters:**
- \`planId\`: The unique identifier of the plan

**Success Response (200):**
```json
{
  "id": "basic-plan",
  "name": "Basic",
  "type": "basic",
  "price": 10000,
  "currency": "IQD",
  "billingCycle": "monthly",
  "credits": 100,
  "features": [
    {
      "name": "Basic Analytics",
      "description": "Essential analytics features"
    }
  ],
  "isActive": true,
  "order": 1
}
```

### Update Plan

Updates an existing plan by ID.

**Endpoint:** \`PUT /api/plans/:planId\`

**Access:** Private (Admin Only)

**Headers:**
```
Authorization: Bearer {{AUTH_TOKEN}}
Content-Type: application/json
```

**Path Parameters:**
- \`planId\`: The unique identifier of the plan to update

**Request Body:**
```json
{
  "price": 12000,
  "credits": 150,
  "features": [
    {
      "name": "Enhanced Analytics",
      "description": "Improved analytics dashboard"
    }
  ],
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "message": "Plan updated successfully.",
  "id": "basic-plan"
}
```

### Delete Plan

Deletes a plan by ID.

**Endpoint:** \`DELETE /api/plans/:planId\`

**Access:** Private (Admin Only)

**Headers:**
```
Authorization: Bearer {{AUTH_TOKEN}}
```

**Path Parameters:**
- \`planId\`: The unique identifier of the plan to delete

**Success Response (200):**
```json
{
  "message": "Plan deleted successfully."
}
```

## Testing Examples

### Using cURL

1. Create a new plan:
```bash
curl -X POST 'https://europe-west3-parezar2-2f7ae.cloudfunctions.net/api/plans' \
-H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
-H 'Content-Type: application/json' \
-d '{
  "name": "Test Plan",
  "type": "standard",
  "price": 15000,
  "currency": "IQD",
  "billingCycle": "monthly",
  "credits": 200,
  "features": [
    {
      "name": "Test Feature",
      "description": "A test feature"
    }
  ]
}'
```

2. Get all plans:
```bash
curl 'https://europe-west3-parezar2-2f7ae.cloudfunctions.net/api/plans'
```

3. Get a specific plan:
```bash
curl 'https://europe-west3-parezar2-2f7ae.cloudfunctions.net/api/plans/PLAN_ID'
```

4. Update a plan:
```bash
curl -X PUT 'https://europe-west3-parezar2-2f7ae.cloudfunctions.net/api/plans/PLAN_ID' \
-H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
-H 'Content-Type: application/json' \
-d '{
  "price": 20000,
  "credits": 250
}'
```

5. Delete a plan:
```bash
curl -X DELETE 'https://europe-west3-parezar2-2f7ae.cloudfunctions.net/api/plans/PLAN_ID' \
-H 'Authorization: Bearer YOUR_AUTH_TOKEN'
```

### Common Error Responses

1. **Unauthorized (401):**
```json
{
  "error": "No valid authorization header provided"
}
```

2. **Not Found (404):**
```json
{
  "error": "Plan not found."
}
```

3. **Server Error (500):**
```json
{
  "error": "Failed to create/update/delete/fetch plan."
}
```

4. **Invalid Request (400):**
```json
{
  "error": "Invalid plan data"
}
```

## Best Practices

1. Always validate plan data before sending:
   - Required fields: name, price, currency, billingCycle, credits, features
   - Price must be a positive number
   - Currency must be 'IQD'
   - BillingCycle must be one of: 'monthly', 'quarterly', 'annual'

2. Handle pagination for large deployments:
   - Use the order field for consistent sorting
   - Plans are returned in ascending order by default

3. Maintain data consistency:
   - Don't delete plans that are currently in use by subscribers
   - Update prices carefully as they affect existing subscriptions
   - Keep feature descriptions clear and concise

4. Security considerations:
   - Protect admin endpoints with proper authentication
   - Validate all input data server-side
   - Monitor for suspicious activities

5. Performance optimization:
   - Cache frequently accessed plans
   - Minimize unnecessary plan updates
   - Use batch operations when updating multiple plans
