import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../config/api';

// Helper function to make authenticated API requests
const fetchWithAuth = async (url, options = {}) => {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

// Query keys
export const caseKeys = {
  all: ['cases'],
  lists: () => [...caseKeys.all, 'list'],
  list: (filters) => [...caseKeys.lists(), { filters }],
  details: () => [...caseKeys.all, 'detail'],
  detail: (id) => [...caseKeys.details(), id],
  stats: () => [...caseKeys.all, 'stats'],
  client: (clientId) => [...caseKeys.all, 'client', clientId],
  advocate: (advocateId) => [...caseKeys.all, 'advocate', advocateId],
};

// Get cases with filtering and pagination
export const useCases = (filters = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });

  return useQuery({
    queryKey: caseKeys.list(filters),
    queryFn: () => {
      const url = queryParams.toString() 
        ? `${API_ENDPOINTS.GET_CASES}?${queryParams}`
        : API_ENDPOINTS.GET_CASES;
      return fetchWithAuth(url);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get single case details
export const useCase = (caseId) => {
  return useQuery({
    queryKey: caseKeys.detail(caseId),
    queryFn: () => fetchWithAuth(API_ENDPOINTS.GET_CASE(caseId)),
    enabled: !!caseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get cases for specific client
export const useClientCases = (clientId) => {
  return useQuery({
    queryKey: caseKeys.client(clientId),
    queryFn: () => fetchWithAuth(API_ENDPOINTS.GET_CASES_BY_CLIENT(clientId)),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
};

// Get cases for specific advocate
export const useAdvocateCases = (advocateId) => {
  return useQuery({
    queryKey: caseKeys.advocate(advocateId),
    queryFn: () => fetchWithAuth(API_ENDPOINTS.GET_CASES_BY_ADVOCATE(advocateId)),
    enabled: !!advocateId,
    staleTime: 5 * 60 * 1000,
  });
};

// Get case statistics
export const useCaseStats = () => {
  return useQuery({
    queryKey: caseKeys.stats(),
    queryFn: () => fetchWithAuth(API_ENDPOINTS.GET_CASE_STATS),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create new case
export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseData) => 
      fetchWithAuth(API_ENDPOINTS.CREATE_CASE, {
        method: 'POST',
        body: JSON.stringify(caseData),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case created successfully');
      return data;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create case');
    },
  });
};

// Update case
export const useUpdateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, ...updateData }) =>
      fetchWithAuth(API_ENDPOINTS.UPDATE_CASE(caseId), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast.success('Case updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update case');
    },
  });
};

// Update case status
export const useUpdateCaseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, status, reason }) =>
      fetchWithAuth(API_ENDPOINTS.UPDATE_CASE_STATUS(caseId), {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast.success('Case status updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update case status');
    },
  });
};

// Assign advocate to case
export const useAssignAdvocate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, advocateId }) =>
      fetchWithAuth(API_ENDPOINTS.ASSIGN_ADVOCATE(caseId), {
        method: 'PUT',
        body: JSON.stringify({ advocateId }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.lists() });
      toast.success('Advocate assigned successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign advocate');
    },
  });
};

// Add timeline update
export const useAddTimelineUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, description, updateType, metadata }) =>
      fetchWithAuth(API_ENDPOINTS.ADD_TIMELINE_UPDATE(caseId), {
        method: 'POST',
        body: JSON.stringify({ description, updateType, metadata }),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(variables.caseId) });
      toast.success('Timeline updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add timeline update');
    },
  });
};

// Upload case document
export const useUploadCaseDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, formData }) =>
      fetch(API_ENDPOINTS.UPLOAD_CASE_DOCUMENT(caseId), {
        method: 'POST',
        credentials: 'include',
        body: formData, // FormData object
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Upload failed');
        }
        return data;
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(variables.caseId) });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload document');
    },
  });
};

// Delete case
export const useDeleteCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseId) =>
      fetchWithAuth(API_ENDPOINTS.DELETE_CASE(caseId), {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case cancelled successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel case');
    },
  });
}; 