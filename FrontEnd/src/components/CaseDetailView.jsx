import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Upload, 
  User, 
  Scale,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  MessageSquare,
  Eye,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { 
  useCase, 
  useUpdateCaseStatus, 
  useAddTimelineUpdate, 
  useUploadCaseDocument 
} from '../hooks/useCases';

const CaseDetailView = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newUpdate, setNewUpdate] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentTags, setDocumentTags] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);

  const { data: caseData, isLoading, error } = useCase(caseId);
  const updateStatusMutation = useUpdateCaseStatus();
  const addTimelineUpdateMutation = useAddTimelineUpdate();
  const uploadDocumentMutation = useUploadCaseDocument();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in-progress': return <Play className="h-4 w-4" />;
      case 'on-hold': return <Pause className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canUpdateStatus = () => {
    if (!user || !caseData?.data) return false;
    const case_ = caseData.data;
    return (
      case_.clientId._id === user._id || 
      case_.advocateId?._id === user._id
    );
  };

  const canAddTimeline = () => {
    if (!user || !caseData?.data) return false;
    const case_ = caseData.data;
    return (
      case_.clientId._id === user._id || 
      case_.advocateId?._id === user._id ||
      case_.internIds?.some(intern => intern._id === user._id)
    );
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!caseId) return;
    
    updateStatusMutation.mutate({
      caseId,
      status: newStatus,
      reason: statusReason
    });
    setStatusReason('');
  };

  const handleAddTimelineUpdate = async () => {
    if (!newUpdate.trim() || !caseId) return;

    addTimelineUpdateMutation.mutate({
      caseId,
      description: newUpdate,
      updateType: 'comment',
      metadata: {}
    });
    setNewUpdate('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !caseId) return;

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('type', documentType || 'other');
    formData.append('tags', documentTags);
    formData.append('isConfidential', isConfidential);

    uploadDocumentMutation.mutate({ caseId, formData });
    
    // Reset form
    setSelectedFile(null);
    setDocumentType('');
    setDocumentTags('');
    setIsConfidential(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading case: {error.message}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const case_ = caseData?.data;
  if (!case_) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{case_.title}</h1>
                <p className="text-sm text-gray-500">Case #{case_.caseNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(case_.status)}>
                {getStatusIcon(case_.status)}
                <span className="ml-1 capitalize">{case_.status}</span>
              </Badge>
              <Badge className={getPriorityColor(case_.priority)}>
                <span className="capitalize">{case_.priority} Priority</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Case Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Case Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="font-medium">Description</Label>
                      <p className="text-gray-700 mt-1">{case_.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-medium">Category</Label>
                        <p className="text-gray-700">{case_.category}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Sub-Category</Label>
                        <p className="text-gray-700">{case_.subCategory || 'Not specified'}</p>
                      </div>
                    </div>
                    {case_.nextHearingDate && (
                      <div>
                        <Label className="font-medium">Next Hearing</Label>
                        <p className="text-gray-700 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(case_.nextHearingDate), 'PPP')}
                        </p>
                      </div>
                    )}
                    {case_.tags && case_.tags.length > 0 && (
                      <div>
                        <Label className="font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {case_.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                {/* Add Timeline Update */}
                {canAddTimeline() && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Update</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Add a timeline update..."
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                      />
                      <Button 
                        onClick={handleAddTimelineUpdate}
                        disabled={!newUpdate.trim() || addTimelineUpdateMutation.isPending}
                      >
                        {addTimelineUpdateMutation.isPending ? 'Adding...' : 'Add Update'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Case Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {case_.timeline?.map((update, index) => (
                        <div key={index} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm text-gray-900">{update.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {update.updatedBy?.firstName} {update.updatedBy?.lastName}
                              </p>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-500">
                                {format(new Date(update.createdAt), 'PPp')}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {update.updateType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {/* Upload Document */}
                {canAddTimeline() && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Document</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="document">Select File</Label>
                        <Input
                          id="document"
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="documentType">Document Type</Label>
                          <Select value={documentType} onValueChange={setDocumentType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="evidence">Evidence</SelectItem>
                              <SelectItem value="court_order">Court Order</SelectItem>
                              <SelectItem value="petition">Petition</SelectItem>
                              <SelectItem value="affidavit">Affidavit</SelectItem>
                              <SelectItem value="correspondence">Correspondence</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="documentTags">Tags (comma-separated)</Label>
                          <Input
                            id="documentTags"
                            placeholder="urgent, contract, etc."
                            value={documentTags}
                            onChange={(e) => setDocumentTags(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="confidential"
                          checked={isConfidential}
                          onChange={(e) => setIsConfidential(e.target.checked)}
                        />
                        <Label htmlFor="confidential">Mark as confidential</Label>
                      </div>
                      <Button 
                        onClick={handleFileUpload}
                        disabled={!selectedFile || uploadDocumentMutation.isPending}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Documents List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Case Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {case_.documents?.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>{doc.type}</span>
                                <span>•</span>
                                <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span>•</span>
                                <span>{format(new Date(doc.createdAt), 'PP')}</span>
                                {doc.isConfidential && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="destructive" className="text-xs">Confidential</Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {(!case_.documents || case_.documents.length === 0) && (
                        <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Case Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Case Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-medium">Client</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{case_.clientId?.firstName} {case_.clientId?.lastName}</span>
                  </div>
                  <p className="text-sm text-gray-500">{case_.clientId?.email}</p>
                </div>
                {case_.advocateId && (
                  <div>
                    <Label className="font-medium">Advocate</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Scale className="h-4 w-4 text-gray-500" />
                      <span>{case_.advocateId?.firstName} {case_.advocateId?.lastName}</span>
                    </div>
                    <p className="text-sm text-gray-500">{case_.advocateId?.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Case Status Management */}
            {canUpdateStatus() && (
              <Card>
                <CardHeader>
                  <CardTitle>Status Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="statusReason">Reason for Change</Label>
                    <Textarea
                      id="statusReason"
                      placeholder="Enter reason for status change..."
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusUpdate('in-progress')}
                      disabled={case_.status === 'in-progress' || updateStatusMutation.isPending}
                    >
                      In Progress
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusUpdate('on-hold')}
                      disabled={case_.status === 'on-hold' || updateStatusMutation.isPending}
                    >
                      On Hold
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusUpdate('closed')}
                      disabled={case_.status === 'closed' || updateStatusMutation.isPending}
                    >
                      Close Case
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={case_.status === 'cancelled' || updateStatusMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Case Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium">
                    {format(new Date(case_.createdAt), 'PP')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-medium">{case_.documents?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Timeline Updates</span>
                  <span className="text-sm font-medium">{case_.timeline?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailView; 