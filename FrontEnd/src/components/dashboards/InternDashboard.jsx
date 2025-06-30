import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BookOpen, Clock, Star, FileText, Settings, LogOut } from 'lucide-react';

const InternDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');

  const stats = [
    {
      title: "Tasks Completed",
      value: "15",
      icon: Star,
      color: "text-yellow-600"
    },
    {
      title: "Hours Logged",
      value: "45",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "Cases Assisted",
      value: "8",
      icon: FileText,
      color: "text-green-600"
    },
    {
      title: "Learning Hours",
      value: "24",
      icon: BookOpen,
      color: "text-purple-600"
    }
  ];

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

        {/* Current Tasks */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for tasks */}
                <p className="text-gray-600">No current tasks to show.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Progress */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for learning progress */}
                <p className="text-gray-600">No learning activities to show.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Assignments */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for case assignments */}
                <p className="text-gray-600">No case assignments to show.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InternDashboard;
