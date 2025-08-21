# Customer Dashboard - Bloom Services

A comprehensive customer dashboard that allows customers to view and manage their purchased services, including IP addresses, subscription status, and infrastructure details.

## Features

- **Service Overview**: View all purchased services with key metrics
- **Detailed Service Information**: 
  - Service name, description, and type
  - Purchase date and subscription status
  - IP addresses for network services
  - Datacenter locations
  - VM specifications (CPU, RAM, Storage, Network)
- **Interactive Dashboard**: Modern, responsive design with hover effects
- **Service Details Modal**: Click on any service to view comprehensive details
- **Status Indicators**: Clear visual indicators for active/expired services
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory with your MongoDB connection string:
```
MONGO_URI=your_mongodb_connection_string_here
```

### 3. Populate Demo Data
To test the dashboard with sample data, make a POST request to:
```
POST /api/demo/populate
```

This will create:
- A demo user (John Smith from TechCorp Solutions)
- 3 sample services (AI Platform, Monitoring Suite, NLP API)
- Customer record with purchased services

### 4. Start the Application
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Customer Dashboard
- `GET /api/customer/dashboard/:userId` - Get customer dashboard data
- `GET /api/customer/service/:serviceId` - Get specific service details

### Demo Data
- `POST /api/demo/populate` - Populate database with sample data

## Data Models

### Customer
- User information and company details
- Array of purchased services with status and IP addresses

### Service
- Service details (name, description, type)
- Hosting information (datacenter location, VM specifications)

### User
- Basic user authentication and role management

## Dashboard Components

### Overview Cards
- Total services count
- Active services count
- Expired services count

### Service Cards
Each service displays:
- Service icon based on type (AI, Infrastructure, etc.)
- Service name and status
- Key details (type, purchase date, IP address)
- Datacenter location and VM specs
- View Details button

### Service Details Modal
Comprehensive view including:
- Full service description
- Network details (IP addresses)
- Infrastructure specifications
- Purchase and status information

## Service Types

- **AI Only** 🤖 - Software-only AI services
- **AI Hosted** ☁️ - AI services with hosting infrastructure
- **Infrastructure** 🏗️ - Pure infrastructure services

## Status Types

- **Active** - Currently active subscription
- **Expired** - Expired subscription

## Customization

### Adding New Service Types
1. Update the `Service` model in `src/server/models/service.js`
2. Add new type to the enum
3. Update the `getServiceTypeIcon` function in the dashboard component

### Modifying Dashboard Layout
1. Edit `src/client/components/CustomerDashboard.jsx`
2. Update styles in `src/client/components/CustomerDashboard.css`

### Adding New Fields
1. Update the relevant model files
2. Modify the API endpoints to include new data
3. Update the dashboard component to display new fields

## Testing

The dashboard includes comprehensive error handling:
- Loading states with spinners
- Error messages with retry functionality
- Empty state handling
- Responsive design testing

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Features

- Lazy loading of service details
- Optimized database queries with population
- Responsive image loading
- Efficient state management

## Security Considerations

- User authentication required for dashboard access
- Input validation on all API endpoints
- Secure database connections
- Role-based access control

## Future Enhancements

- Service renewal functionality
- Usage analytics and reporting
- Service monitoring integration
- Billing and invoice integration
- Support ticket management
- Service scaling options 