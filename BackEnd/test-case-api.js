/**
 * Test file for Case Management API
 * This file demonstrates how to use the Case API endpoints
 * Run with: node test-case-api.js
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5001/api';

// Helper function to make authenticated API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.message || response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Test data
const testUser = {
  email: "testclient@example.com",
  password: "testpassword123",
  firstName: "Test",
  lastName: "Client",
  mobile: "9876543210",
  address: "123 Test Street",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  idType: "aadhaar",
  userType: "client"
};

const testCase = {
  title: "Property Dispute Case",
  description: "A detailed description of a property dispute involving inheritance issues and documentation problems.",
  category: "Property Law",
  subCategory: "Inheritance Dispute",
  priority: "high",
  courtName: "Mumbai District Court",
  courtLevel: "District Court",
  expectedDuration: 6,
  consultationFee: 5000,
  totalFee: 50000,
  nextHearingDate: "2024-02-15",
  deadlineDate: "2024-06-30",
  tags: ["property", "inheritance", "urgent"],
  notes: "Client needs urgent resolution due to family circumstances"
};

async function runTests() {
  let authToken = null;
  let caseId = null;

  try {
    console.log('🚀 Starting Case Management API Tests...\n');

    // Step 1: User Authentication (assuming user exists)
    console.log('1. Authenticating test user...');
    try {
      const loginResponse = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      authToken = loginResponse.token || 'mock-token'; // Use mock token if no real token
      console.log('✅ User authenticated successfully');
    } catch (error) {
      console.log('⚠️  Authentication failed (user may not exist), using mock token');
      authToken = 'mock-token';
    }

    // Step 2: Create a new case
    console.log('\n2. Creating a new case...');
    try {
      const createResponse = await apiRequest('/cases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(testCase)
      });
      
      caseId = createResponse.data._id;
      console.log('✅ Case created successfully');
      console.log(`   Case ID: ${caseId}`);
      console.log(`   Case Number: ${createResponse.data.caseNumber}`);
      console.log(`   Status: ${createResponse.data.status}`);
    } catch (error) {
      console.log('❌ Failed to create case:', error.message);
      return;
    }

    // Step 3: Retrieve the created case
    console.log('\n3. Retrieving the case...');
    try {
      const getResponse = await apiRequest(`/cases/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Case retrieved successfully');
      console.log(`   Title: ${getResponse.data.title}`);
      console.log(`   Category: ${getResponse.data.category}`);
      console.log(`   Priority: ${getResponse.data.priority}`);
      console.log(`   Timeline entries: ${getResponse.data.timeline.length}`);
    } catch (error) {
      console.log('❌ Failed to retrieve case:', error.message);
    }

    // Step 4: Add a timeline update
    console.log('\n4. Adding timeline update...');
    try {
      const timelineResponse = await apiRequest(`/cases/${caseId}/timeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          description: 'Initial case review completed. Gathering additional documents.',
          updateType: 'comment',
          metadata: {
            reviewer: 'Test Client',
            priority: 'normal'
          }
        })
      });
      
      console.log('✅ Timeline update added successfully');
      console.log(`   Update: ${timelineResponse.data.description}`);
    } catch (error) {
      console.log('❌ Failed to add timeline update:', error.message);
    }

    // Step 5: Update case status
    console.log('\n5. Updating case status...');
    try {
      const statusResponse = await apiRequest(`/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          status: 'in-progress',
          reason: 'Documentation review completed, proceeding with legal analysis'
        })
      });
      
      console.log('✅ Case status updated successfully');
      console.log(`   New Status: ${statusResponse.data.status}`);
    } catch (error) {
      console.log('❌ Failed to update case status:', error.message);
    }

    // Step 6: Get case statistics
    console.log('\n6. Retrieving case statistics...');
    try {
      const statsResponse = await apiRequest('/cases/stats/overview', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Case statistics retrieved successfully');
      console.log(`   Total Cases: ${statsResponse.data.totalCases}`);
      console.log(`   Average Age: ${Math.round(statsResponse.data.averageAge)} days`);
    } catch (error) {
      console.log('❌ Failed to retrieve case statistics:', error.message);
    }

    // Step 7: List all cases
    console.log('\n7. Listing all cases...');
    try {
      const listResponse = await apiRequest('/cases?page=1&limit=5', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Cases listed successfully');
      console.log(`   Total Cases: ${listResponse.pagination.total}`);
      console.log(`   Current Page: ${listResponse.pagination.currentPage}`);
      console.log(`   Cases on this page: ${listResponse.data.length}`);
    } catch (error) {
      console.log('❌ Failed to list cases:', error.message);
    }

    console.log('\n🎉 Case Management API Tests Completed!');
    
    // Cleanup note
    console.log('\n📝 Note: The created test case remains in the database.');
    console.log(`   Case ID: ${caseId}`);
    console.log('   You can manually delete it or implement cleanup in your application.');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// API Endpoints Documentation
function printAPIDocumentation() {
  console.log(`
📖 Case Management API Endpoints:

🔐 Authentication Required: All endpoints require valid JWT token

📝 Case CRUD Operations:
  POST   /api/cases                    - Create new case
  GET    /api/cases                    - List cases (with filtering & pagination)
  GET    /api/cases/:id                - Get specific case
  PUT    /api/cases/:id                - Update case details
  DELETE /api/cases/:id                - Delete/cancel case (client only)

🎯 Case Management:
  PUT    /api/cases/:id/assign         - Assign advocate to case
  PUT    /api/cases/:id/status         - Update case status
  POST   /api/cases/:id/timeline       - Add timeline update
  POST   /api/cases/:id/documents      - Upload case document

📊 Case Queries:
  GET    /api/cases/client/:clientId   - Get cases for specific client
  GET    /api/cases/advocate/:advocateId - Get cases for specific advocate
  GET    /api/cases/stats/overview     - Get case statistics

🔍 Query Parameters (for GET /api/cases):
  - page, limit: Pagination
  - status: Filter by case status
  - category: Filter by case category
  - priority: Filter by priority level
  - search: Text search in title/description
  - sortBy, sortOrder: Sorting options

📁 File Upload:
  - Supports PDF, Word docs, and images
  - Maximum file size: 10MB
  - Documents are tagged and tracked in timeline

🔒 Access Control:
  - Clients: Can create, view own cases, assign advocates
  - Advocates: Can view assigned cases, update status, add timeline
  - Interns: Can view assigned cases, add timeline updates
  `);
}

// Main execution
if (process.argv.includes('--docs')) {
  printAPIDocumentation();
} else if (process.argv.includes('--test')) {
  runTests();
} else {
  console.log('Case Management API Test Suite');
  console.log('Usage:');
  console.log('  node test-case-api.js --test   # Run API tests');
  console.log('  node test-case-api.js --docs   # Show API documentation');
}

export { apiRequest, runTests, printAPIDocumentation }; 