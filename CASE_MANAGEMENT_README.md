# Case Management System

## Overview

A comprehensive Case Management system has been implemented for your legal-tech platform, providing complete CRUD operations, document management, timeline tracking, and role-based access control.

## 📁 Files Created/Modified

### Backend Files
- **`BackEnd/src/models/case.model.js`** - Complete Case model with timeline and document schemas
- **`BackEnd/src/routes/case.routes.js`** - Full REST API routes for case management
- **`BackEnd/src/app.js`** - Updated to include case routes

### Frontend Files
- **`FrontEnd/src/config/api.js`** - Added case management API endpoints

## 🗃️ Database Schema

### Case Model Features
```javascript
{
  title: String,                    // Case title
  description: String,              // Detailed case description
  caseNumber: String,               // Auto-generated unique case number
  clientId: ObjectId,               // Reference to client
  advocateId: ObjectId,             // Reference to assigned advocate (optional)
  internIds: [ObjectId],            // Array of assigned interns
  status: Enum,                     // open, in-progress, closed, on-hold, cancelled
  priority: Enum,                   // low, medium, high, urgent
  category: Enum,                   // Legal category (Criminal Law, Civil Law, etc.)
  subCategory: String,              // Specific sub-category
  courtName: String,                // Court handling the case
  courtLevel: Enum,                 // District Court, High Court, Supreme Court, etc.
  expectedDuration: Number,         // Expected duration in months
  consultationFee: Number,          // Consultation fee amount
  totalFee: Number,                 // Total case fee
  paidAmount: Number,               // Amount paid so far
  nextHearingDate: Date,            // Next court hearing date
  deadlineDate: Date,               // Case deadline
  documents: [DocumentSchema],      // Embedded documents
  timeline: [TimelineSchema],       // Case timeline updates
  tags: [String],                   // Case tags for categorization
  isActive: Boolean,                // Soft delete flag
  clientSatisfactionRating: Number, // Client rating (1-5)
  notes: String,                    // Additional notes
  metadata: Mixed                   // Flexible metadata storage
}
```

### Document Schema
```javascript
{
  name: String,                     // Original filename
  url: String,                      // File storage path
  type: Enum,                       // contract, evidence, court_order, etc.
  size: Number,                     // File size in bytes
  uploadedBy: ObjectId,             // User who uploaded
  uploadedByRole: Enum,             // client, advocate, intern
  isConfidential: Boolean,          // Confidentiality flag
  tags: [String],                   // Document tags
  createdAt: Date,                  // Upload timestamp
  updatedAt: Date
}
```

### Timeline Schema
```javascript
{
  description: String,              // Timeline update description
  updatedBy: ObjectId,              // User who made the update
  updatedByRole: Enum,              // client, advocate, intern, system
  updateType: Enum,                 // status_change, assignment, document_upload, etc.
  metadata: Mixed,                  // Additional update data
  createdAt: Date,                  // Timestamp
  updatedAt: Date
}
```

## 🔗 API Endpoints

### Case CRUD Operations
- `POST /api/cases` - Create new case (Client only)
- `GET /api/cases` - List cases with filtering and pagination
- `GET /api/cases/:id` - Get specific case details
- `PUT /api/cases/:id` - Update case details
- `DELETE /api/cases/:id` - Soft delete case (Client only)

### Case Management
- `PUT /api/cases/:id/assign` - Assign advocate to case
- `PUT /api/cases/:id/status` - Update case status
- `POST /api/cases/:id/timeline` - Add timeline update
- `POST /api/cases/:id/documents` - Upload case document

### Case Queries
- `GET /api/cases/client/:clientId` - Get cases for specific client
- `GET /api/cases/advocate/:advocateId` - Get cases for specific advocate
- `GET /api/cases/stats/overview` - Get case statistics

## 🔐 Security & Access Control

### Role-Based Access
- **Clients**: Can create cases, view own cases, assign advocates, upload documents
- **Advocates**: Can view assigned cases, update status, add timeline updates, upload documents
- **Interns**: Can view assigned cases, add timeline updates, upload documents
- **Admin**: Full access to all cases

### Data Protection
- All endpoints require JWT authentication
- Users can only access cases they're involved in
- Document confidentiality flags for sensitive files
- Comprehensive audit trail via timeline

## 📊 Features

### Advanced Query Options
```javascript
// Filtering options
{
  status: 'open',                   // Filter by status
  category: 'Criminal Law',         // Filter by category
  priority: 'high',                 // Filter by priority
  search: 'property dispute',       // Text search
  sortBy: 'createdAt',             // Sort field
  sortOrder: 'desc',               // Sort direction
  page: 1,                         // Pagination
  limit: 10                        // Items per page
}
```

### Timeline Tracking
- Automatic timeline entries for case creation, status changes, assignments
- Manual timeline updates for case progress
- Metadata storage for additional context
- User attribution for all updates

### Document Management
- File upload with type validation (PDF, Word, Images)
- Document categorization and tagging
- Confidentiality controls
- Size limits (10MB per file)
- Automatic timeline entries for uploads

### Case Statistics
- Case count by status
- Average case duration
- Fee analytics
- Performance metrics

## 🚀 Model Methods

### Case Instance Methods
```javascript
// Add timeline update
case.addTimelineUpdate(description, userId, userRole, updateType, metadata);

// Add document
case.addDocument(documentData);

// Update status with timeline
case.updateStatus(newStatus, userId, userRole, reason);

// Assign advocate with timeline
case.assignAdvocate(advocateId, assignedBy, assignedByRole);
```

### Static Methods
```javascript
// Get case statistics
Case.getStatistics(filter);
```

### Virtual Properties
```javascript
case.ageInDays          // Case age in days
case.progressPercentage // Progress percentage based on status
```

## 📝 Frontend Integration

### API Configuration
All case endpoints are configured in `FrontEnd/src/config/api.js`:

```javascript
// Case endpoints
CREATE_CASE: `${API_BASE_URL}/cases`,
GET_CASES: `${API_BASE_URL}/cases`,
GET_CASE: (id) => `${API_BASE_URL}/cases/${id}`,
UPDATE_CASE: (id) => `${API_BASE_URL}/cases/${id}`,
// ... and more
```

### Usage Example
```javascript
// Create a new case
const newCase = await fetch(API_ENDPOINTS.CREATE_CASE, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(caseData)
});

// Get cases with filtering
const cases = await fetch(`${API_ENDPOINTS.GET_CASES}?status=open&page=1&limit=10`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔧 Database Indexes

Optimized indexes for performance:
- `{ clientId: 1, status: 1 }` - Client case queries
- `{ advocateId: 1, status: 1 }` - Advocate case queries
- `{ status: 1, priority: 1 }` - Status and priority filtering
- `{ category: 1 }` - Category filtering
- `{ createdAt: -1 }` - Recent cases
- `{ 'timeline.createdAt': -1 }` - Timeline queries

## 🎯 Key Features Implemented

### ✅ Core Requirements Met
- [x] Complete Case model with all specified fields
- [x] Express routes for CRUD operations
- [x] Case assignment functionality
- [x] Status management with tracking
- [x] Document upload and management
- [x] Timeline updates and audit trail
- [x] Role-based access control
- [x] Advanced filtering and pagination
- [x] Case statistics and analytics

### ✅ Additional Features
- [x] Automatic case number generation
- [x] Soft delete functionality
- [x] Document type validation
- [x] Confidentiality controls
- [x] Comprehensive error handling
- [x] Database indexing for performance
- [x] File size and type validation
- [x] User activity tracking

## 📈 Next Steps

To complete the case management integration:

1. **Frontend Components**: Create React components for case listing, creation, and detail views
2. **Dashboard Integration**: Update dashboards to show real case data
3. **Notification System**: Add real-time notifications for case updates
4. **Calendar Integration**: Connect case hearings with calendar system
5. **Reporting**: Build advanced reporting and analytics features

## 🧪 Testing

The implementation includes comprehensive error handling and validation. Consider adding:
- Unit tests for model methods
- Integration tests for API endpoints
- End-to-end tests for case workflows

## 🔍 Monitoring

The system logs all case activities for monitoring:
- Case creation and updates
- Document uploads
- Status changes
- User access patterns

This implementation provides a solid foundation for case management in your legal-tech platform, with room for future enhancements and integrations. 