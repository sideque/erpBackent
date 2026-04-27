# Management Contract API Documentation

## 1. Create Management Contract
**POST** `/api/management-contracts`

**Request Body:**
```json
{
  "propertyId": "60d5f9b4f1b2c3d4e5f6a7b8",
  "ownerId": "60d5f9b4f1b2c3d4e5f6a7b9",
  "contractStartDate": "2026-05-01",
  "contractEndDate": "2027-04-30",
  "autoRenew": true,
  "contractStatus": "Active",
  "commissionType": "Percentage",
  "commissionValue": 5,
  "ownerSharePercentage": 95,
  "companySharePercentage": 5,
  "paymentCycle": "Monthly",
  "expenseResponsibility": "Owner",
  "expenseApprovalRequired": true,
  "expenseLimit": 2000,
  "canCollectRent": true,
  "canManageTenants": true,
  "canHandleMaintenance": true,
  "canListProperty": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5f9b4f1b2c3d4e5f6a7c0",
    "contractStatus": "Active",
    "propertyId": "60d5f9b4f1b2c3d4e5f6a7b8",
    ...
  }
}
```

## 2. List Contracts
**GET** `/api/management-contracts?contractStatus=Active&limit=10`

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": { "total": 12, "page": 1, "limit": 10 }
}
```

## 3. Update Status
**PATCH** `/api/management-contracts/:id/status`

**Request Body:**
```json
{
  "status": "Terminated"
}
```

## 4. Renew Contract
**POST** `/api/management-contracts/:id/renew`

**Request Body:**
```json
{
  "contractStartDate": "2027-05-01",
  "contractEndDate": "2028-04-30"
}
```
