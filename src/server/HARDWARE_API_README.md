# Product Allocation API Documentation

This API provides comprehensive product tracking and allocation management for IT teams to monitor which customer is using which specific product (including hardware).

## Overview

The Product Allocation System integrates with your existing Product model and adds:
- **Enhanced Product Model**: Hardware tracking capabilities within your existing products
- **ProductAllocation**: Tracks customer-product relationships and usage

## API Endpoints

### Base URL
```
/api/product-allocation
```

### 1. Product Allocation Management

#### Allocate Product to Customer
```http
POST /api/product-allocation/allocate
```
**Body:**
```json
{
  "customerId": "customer_id_here",
  "productId": "product_id_here",
  "serviceId": "service_id_here",
  "allocationType": "dedicated",
  "usageDetails": {
    "purpose": "Production web hosting",
    "workload": "High-traffic web applications",
    "performanceRequirements": "99.9% uptime, low latency"
  },
  "billing": {
    "rate": 500,
    "billingCycle": "monthly"
  }
}
```

#### Get All Hardware
```http
GET /api/hardware/hardware?status=available&type=server&location=DC-East-01&vendor=Dell
```
**Query Parameters:**
- `status`: Filter by hardware status (available, allocated, maintenance, retired, faulty)
- `type`: Filter by hardware type (server, storage, network, gpu, cpu, memory, other)
- `location`: Filter by datacenter location
- `vendor`: Filter by vendor

#### Get Hardware by ID
```http
GET /api/hardware/hardware/:id
```

#### Update Hardware
```http
PUT /api/hardware/hardware/:id
```

#### Delete Hardware
```http
DELETE /api/hardware/hardware/:id
```

### 2. Hardware Allocation Management

#### Allocate Hardware to Customer
```http
POST /api/hardware/hardware/allocate
```
**Body:**
```json
{
  "customerId": "customer_id_here",
  "hardwareId": "hardware_id_here",
  "serviceId": "service_id_here",
  "allocationType": "dedicated",
  "usageDetails": {
    "purpose": "Production web hosting",
    "workload": "High-traffic web applications",
    "performanceRequirements": "99.9% uptime, low latency"
  },
  "billing": {
    "rate": 500,
    "billingCycle": "monthly"
  }
}
```

#### Deallocate Hardware
```http
PUT /api/hardware/hardware/deallocate/:allocationId
```
**Body:**
```json
{
  "notes": "Customer requested deallocation due to service termination"
}
```

### 3. IT Team Queries

#### Get Customer-Hardware Mapping
```http
GET /api/hardware/mapping/customer?customerId=customer_id&hardwareType=server
```
**Query Parameters:**
- `customerId`: Filter by specific customer
- `hardwareType`: Filter by hardware type
- `status`: Filter by allocation status (default: active)

**Response:** Returns all active allocations with populated customer, hardware, and service details.

#### Get Hardware Utilization Report
```http
GET /api/hardware/utilization?datacenter=DC-East-01&hardwareType=server
```
**Query Parameters:**
- `datacenter`: Filter by datacenter location
- `hardwareType`: Filter by hardware type

**Response:** Returns comprehensive utilization report showing all hardware and their allocation status.

#### Get Maintenance Schedule
```http
GET /api/hardware/maintenance?upcoming=true&overdue=true
```
**Query Parameters:**
- `upcoming`: Show hardware with maintenance due in next 30 days
- `overdue`: Show hardware with overdue maintenance

#### Get Hardware by Customer
```http
GET /api/hardware/customer/:customerId
```
**Response:** Returns all hardware allocated to a specific customer.

#### Get Available Hardware
```http
GET /api/hardware/available?type=server&location=DC-East-01
```
**Query Parameters:**
- `type`: Filter by hardware type
- `location`: Filter by datacenter location

## Hardware Types

- **server**: Physical or virtual servers
- **storage**: Storage arrays, SAN, NAS devices
- **network**: Switches, routers, load balancers
- **gpu**: Graphics processing units for AI/ML workloads
- **cpu**: Central processing units
- **memory**: RAM modules
- **other**: Miscellaneous hardware

## Hardware Status Values

- **available**: Ready for allocation
- **allocated**: Currently assigned to a customer
- **maintenance**: Under maintenance
- **retired**: No longer in service
- **faulty**: Hardware with issues

## Allocation Status Values

- **active**: Currently active allocation
- **inactive**: Deallocated hardware
- **pending**: Allocation request pending
- **suspended**: Temporarily suspended

## Usage Examples

### 1. Find All Hardware Allocated to a Specific Customer
```bash
curl "http://localhost:3000/api/hardware/customer/customer_id_here"
```

### 2. Get Available Servers in a Specific Datacenter
```bash
curl "http://localhost:3000/api/hardware/available?type=server&location=DC-East-01"
```

### 3. View Maintenance Schedule for Next 30 Days
```bash
curl "http://localhost:3000/api/hardware/maintenance?upcoming=true"
```

### 4. Allocate a GPU to a Customer
```bash
curl -X POST "http://localhost:3000/api/hardware/hardware/allocate" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer_id",
    "hardwareId": "gpu_id",
    "serviceId": "ai_service_id",
    "allocationType": "dedicated",
    "usageDetails": {
      "purpose": "AI model training",
      "workload": "Deep learning workloads"
    }
  }'
```

## Database Schema

### Hardware Schema
```javascript
{
  serialNumber: String (unique),
  name: String,
  type: String (enum),
  model: String,
  vendor: String,
  specifications: Object,
  location: Object,
  status: String (enum),
  purchaseDate: Date,
  warrantyExpiry: Date,
  lastMaintenance: Date,
  nextMaintenance: Date,
  notes: String,
  tags: [String],
  timestamps: true
}
```

### HardwareAllocation Schema
```javascript
{
  customerId: ObjectId (ref: Customer),
  hardwareId: ObjectId (ref: Hardware),
  serviceId: ObjectId (ref: Service),
  allocationDate: Date,
  deallocationDate: Date,
  status: String (enum),
  allocationType: String (enum),
  usageDetails: Object,
  billing: Object,
  notes: String,
  allocatedBy: ObjectId (ref: User),
  deallocatedBy: ObjectId (ref: User),
  timestamps: true
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

Error responses include a message describing the issue:
```json
{
  "error": "Hardware is not available for allocation"
}
```

## Setup Demo Data

To populate the system with sample data, run:
```javascript
import setupHardwareDemoData from './setupHardwareDemoData.js';
await setupHardwareDemoData();
```

This will create sample hardware pieces and allocations for testing purposes.
