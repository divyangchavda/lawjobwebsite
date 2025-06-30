const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    GET_CURRENT_USER: `${API_BASE_URL}/auth/me`,
    
    // User endpoints
    GET_PROFILE: `${API_BASE_URL}/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/users/change-password`,
    
    // Advocate endpoints
    GET_ALL_ADVOCATES: `${API_BASE_URL}/advocates/all`,
    SEARCH_ADVOCATES: `${API_BASE_URL}/advocates/search`,
    GET_ADVOCATE: (id) => `${API_BASE_URL}/advocates/${id}`,
    UPDATE_ADVOCATE: (id) => `${API_BASE_URL}/advocates/${id}`,
    GET_ADVOCATE_PROFILE: `${API_BASE_URL}/advocates/profile`,
    UPDATE_ADVOCATE_PROFILE: `${API_BASE_URL}/advocates/profile`,
    ADD_REVIEW: (id) => `${API_BASE_URL}/advocates/${id}/reviews`,
    GET_ADVOCATE_CASES: `${API_BASE_URL}/advocates/cases`,
    GET_ADVOCATE_APPOINTMENTS: `${API_BASE_URL}/advocates/appointments`,
    
    // Intern endpoints
    GET_INTERNS: `${API_BASE_URL}/interns`,
    GET_INTERN: (id) => `${API_BASE_URL}/interns/${id}`,
    GET_INTERN_PROFILE: `${API_BASE_URL}/interns/profile`,
    UPDATE_INTERN_PROFILE: `${API_BASE_URL}/interns/profile`,
    GET_INTERN_TASKS: `${API_BASE_URL}/interns/tasks`,
    GET_INTERN_APPLICATIONS: `${API_BASE_URL}/interns/applications`,
    ADD_INTERN_ACHIEVEMENT: `${API_BASE_URL}/interns/achievements`,
    ADD_INTERN_CERTIFICATION: `${API_BASE_URL}/interns/certifications`,
    
    // Client endpoints
    GET_CLIENT_STATS: (id) => `${API_BASE_URL}/clients/stats/${id}`,
    GET_CLIENT_CASES: `${API_BASE_URL}/clients/cases`,
    GET_CLIENT_SAVED_ADVOCATES: `${API_BASE_URL}/clients/saved-advocates`,
    SAVE_ADVOCATE: (advocateId) => `${API_BASE_URL}/clients/save-advocate/${advocateId}`,
    REMOVE_SAVED_ADVOCATE: (advocateId) => `${API_BASE_URL}/clients/saved-advocate/${advocateId}`,
    GET_CLIENT_APPOINTMENTS: `${API_BASE_URL}/clients/appointments`,
    UPDATE_CLIENT_PROFILE: `${API_BASE_URL}/clients/profile`,
    
    // Booking endpoints
    CREATE_BOOKING: `${API_BASE_URL}/appointments`,
    GET_BOOKINGS: (userId) => `${API_BASE_URL}/bookings/user/${userId}`,
    UPDATE_BOOKING: (id) => `${API_BASE_URL}/bookings/${id}`,
    
    // Chat endpoints
    GET_CHAT_ROOMS: `${API_BASE_URL}/chats`,
    GET_CHAT_MESSAGES: (roomId) => `${API_BASE_URL}/chats/${roomId}/messages`,
    SEND_MESSAGE: (roomId) => `${API_BASE_URL}/chats/${roomId}/messages`,

    // Appointment endpoints
    GET_ADVOCATE_APPOINTMENTS: (advocateId) => `${API_BASE_URL}/appointments/advocate/${advocateId}`,
    GET_CLIENT_APPOINTMENTS: (clientId) => `${API_BASE_URL}/appointments/client/${clientId}`,
    UPDATE_APPOINTMENT_STATUS: (id) => `${API_BASE_URL}/appointments/${id}/status`,

    // Common endpoints
    UPLOAD_FILE: `${API_BASE_URL}/upload`,
    GET_FILE: `${API_BASE_URL}/files`,
};

export default API_ENDPOINTS; 