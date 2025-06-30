import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../config/api';
import RegistrationFlow from './RegistrationFlow';

const Register = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('client');
  const [step, setStep] = useState(1);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(1);
  };

  const handleRegistrationComplete = () => {
    toast.success('Registration successful! Please login to continue.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={handleRoleSelect} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="advocate">Advocate</TabsTrigger>
              <TabsTrigger value="intern">Intern</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <RegistrationFlow 
                userType="client" 
                onComplete={handleRegistrationComplete}
                onBack={() => navigate('/login')}
              />
            </TabsContent>

            <TabsContent value="advocate">
              <RegistrationFlow 
                userType="advocate" 
                onComplete={handleRegistrationComplete}
                onBack={() => navigate('/login')}
              />
            </TabsContent>

            <TabsContent value="intern">
              <RegistrationFlow 
                userType="intern" 
                onComplete={handleRegistrationComplete}
                onBack={() => navigate('/login')}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register; 