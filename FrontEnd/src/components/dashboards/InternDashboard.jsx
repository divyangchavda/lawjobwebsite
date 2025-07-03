import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { BookOpen, Clock, Star, FileText, Settings, LogOut, Eye, Gavel, CheckCircle } from 'lucide-react';
import { useCases, useCaseStats } from '../../hooks/useCases';

const InternDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('assigned');

  // Fetch case data using TanStack Query
  const { data: casesData, isLoading: casesLoading } = useCases();
  const { data: statsData, isLoading: statsLoading } = useCaseStats();

  const cases = casesData?.data || [];
  const assignedCases = cases.filter(case_ => 
    case_.internIds?.some(intern => intern._id === user?._id)
  );
  const activeCases = assignedCases.filter(case_ => ['open', 'in-progress'].includes(case_.status));
  const completedCases = assignedCases.filter(case_ => case_.status === 'closed');

  const stats = [
    {
      title: "Assigned Cases",
      value: assignedCases.length.toString(),
      icon: Gavel,
      color: "text-blue-600"
    },
    {
      title: "Active Cases",
      value: activeCases.length.toString(),
      icon: Star,
      color: "text-yellow-600"
    },
    {
      title: "Completed Cases",
      value: completedCases.length.toString(),
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Learning Hours",
      value: "24",
      icon: BookOpen,
      color: "text-purple-600"
    }
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Intern Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="flex items-center p-6">
                  <div className={`rounded-full p-3 ${stat.color} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Assigned Cases */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Cases</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSelectedTab('assigned')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === 'assigned'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All Assigned ({assignedCases.length})
                </button>
                <button
                  onClick={() => setSelectedTab('active')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === 'active'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Active ({activeCases.length})
                </button>
                <button
                  onClick={() => setSelectedTab('completed')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === 'completed'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Completed ({completedCases.length})
                </button>
              </div>

              {/* Loading State */}
              {casesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading cases...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* All Assigned Cases */}
                  {selectedTab === 'assigned' && (
                    <>
                      {assignedCases.length > 0 ? (
                        assignedCases.map((case_) => (
                          <div
                            key={case_._id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/cases/${case_._id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-grow">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{case_.title}</h3>
                                  <Badge className={getStatusColor(case_.status)}>
                                    {case_.status}
                                  </Badge>
                                  <Badge className={getPriorityColor(case_.priority)}>
                                    {case_.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {case_.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Case #{case_.caseNumber}</span>
                                  <span>•</span>
                                  <span>{case_.category}</span>
                                  <span>•</span>
                                  <span>Client: {case_.clientId?.firstName} {case_.clientId?.lastName}</span>
                                  <span>•</span>
                                  <span>Advocate: {case_.advocateId?.firstName} {case_.advocateId?.lastName}</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No cases assigned yet</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Your assigned cases will appear here when advocates add you to their cases.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Active Cases */}
                  {selectedTab === 'active' && (
                    <>
                      {activeCases.length > 0 ? (
                        activeCases.map((case_) => (
                          <div
                            key={case_._id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50"
                            onClick={() => navigate(`/cases/${case_._id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-grow">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{case_.title}</h3>
                                  <Badge className={getStatusColor(case_.status)}>
                                    {case_.status}
                                  </Badge>
                                  <Badge className={getPriorityColor(case_.priority)}>
                                    {case_.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {case_.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Case #{case_.caseNumber}</span>
                                  <span>•</span>
                                  <span>{case_.category}</span>
                                  <span>•</span>
                                  <span>Client: {case_.clientId?.firstName} {case_.clientId?.lastName}</span>
                                  <span>•</span>
                                  <span>Advocate: {case_.advocateId?.firstName} {case_.advocateId?.lastName}</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No active cases</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Completed Cases */}
                  {selectedTab === 'completed' && (
                    <>
                      {completedCases.length > 0 ? (
                        completedCases.map((case_) => (
                          <div
                            key={case_._id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer opacity-75"
                            onClick={() => navigate(`/cases/${case_._id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-grow">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{case_.title}</h3>
                                  <Badge className={getStatusColor(case_.status)}>
                                    {case_.status}
                                  </Badge>
                                  <Badge className={getPriorityColor(case_.priority)}>
                                    {case_.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {case_.description}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Case #{case_.caseNumber}</span>
                                  <span>•</span>
                                  <span>{case_.category}</span>
                                  <span>•</span>
                                  <span>Client: {case_.clientId?.firstName} {case_.clientId?.lastName}</span>
                                  <span>•</span>
                                  <span>Completed {format(new Date(case_.updatedAt), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No completed cases yet</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InternDashboard;
