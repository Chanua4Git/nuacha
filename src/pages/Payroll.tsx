import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calculator, FileText, Download, Loader2, Edit, Trash2 } from 'lucide-react';
import { EmployeeForm } from '@/components/payroll/EmployeeForm';
import { UnifiedPayrollCalculator } from '@/components/payroll/UnifiedPayrollCalculator';
import { EnhancedPayrollCalculator } from '@/components/payroll/EnhancedPayrollCalculator';
import { useUnifiedPayroll } from '@/hooks/useUnifiedPayroll';
import { useAuth } from '@/auth/contexts/AuthProvider';
import PayrollLeadCaptureModal from '@/components/payroll/PayrollLeadCaptureModal';
import DemoBreadcrumbs from '@/components/DemoBreadcrumbs';
import LeadCaptureForm from '@/components/demo/LeadCaptureForm';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Employee, PayrollEntry } from '@/types/payroll';
import { formatTTCurrency } from '@/utils/payrollCalculations';
const Payroll: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    employees,
    payrollPeriods,
    payrollEntries,
    loading,
    addEmployee,
    updateEmployee,
    removeEmployee,
    addPayrollPeriod,
    addPayrollEntry,
    getEntriesForPeriod,
    isDemo,
  } = useUnifiedPayroll();
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('about');
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const handleAddEmployee = async (data: any) => {
    const result = await addEmployee({
      ...data,
      is_active: true
    });
    if (result) {
      setShowEmployeeForm(false);
    }
  };
  const handleEditEmployee = async (data: any) => {
    if (!editingEmployee) return;
    await updateEmployee(editingEmployee.id, data);
    setEditingEmployee(null);
    setShowEmployeeForm(false);
  };
  const handleDeleteEmployee = async (employee: Employee) => {
    if (confirm(`Are you sure you want to remove ${employee.first_name} ${employee.last_name}? This will mark them as inactive.`)) {
      await removeEmployee(employee.id);
    }
  };
  const startEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };
  const cancelForm = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  };
  const handleCalculationComplete = (employee: Employee, calculation: any, input: any) => {
    // For now, just show success - in real app would save to payroll period
    console.log('Payroll calculated:', {
      employee,
      calculation,
      input
    });
  };

  const exportEmployeeData = () => {
    if (employees.length === 0) return;
    
    if (isDemo) {
      setShowLeadCapture(true);
      return;
    }
    
    const csvHeader = 'Employee Number,First Name,Last Name,Employment Type,Rate,Email,Phone,NIS Number\n';
    const csvData = employees.map(emp => [emp.employee_number, emp.first_name, emp.last_name, emp.employment_type, emp.employment_type === 'hourly' ? emp.hourly_rate : emp.employment_type === 'daily' ? emp.daily_rate : emp.monthly_salary, emp.email || '', emp.phone || '', emp.nis_number || ''].join(',')).join('\n');
    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleLeadCapture = async (data: { email: string; name: string; interestType: string; additionalInfo: string }) => {
    try {
      await supabase.from('demo_leads').insert({
        email: data.email,
        name: data.name,
        interest_type: data.interestType,
        additional_info: data.additionalInfo
      });
      
      setShowLeadCapture(false);
      navigate('/signup');
    } catch (error) {
      console.error('Error saving lead:', error);
      navigate('/signup');
    }
  };

  const handleSignUpClick = () => {
    if (user) {
      // Already logged in, no need to capture lead
      return;
    }
    setShowLeadCapture(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo breadcrumbs for non-authenticated users */}
      {isDemo && <DemoBreadcrumbs currentPage="demo" />}
      
      {/* Demo notification banner */}
      {isDemo && (
        <div className="bg-accent/10 border-b border-accent/20 px-4 py-3">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium">You're exploring our payroll system</p>
                <p className="text-xs text-muted-foreground">Your data is temporarily stored. Sign up to save permanently and access all features.</p>
              </div>
              <Button onClick={handleSignUpClick} size="sm" className="whitespace-nowrap">
                Sign up to get started
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trinidad & Tobago Payroll System</h1>
          <p className="text-muted-foreground mt-2">
            Manage employees and calculate payroll with automatic NIS contributions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportEmployeeData} variant="outline" disabled={employees.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted p-1 text-muted-foreground w-full overflow-x-auto scrollbar-none">
          <TabsTrigger value="about" className="relative flex-shrink-0 px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg">
            About
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="relative flex-shrink-0 px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="employees" className="relative flex-shrink-0 px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg">
            Employees
          </TabsTrigger>
          <TabsTrigger value="calculator" className="relative flex-shrink-0 px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg">
            Calculator
          </TabsTrigger>
          <TabsTrigger value="reports" className="relative flex-shrink-0 px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-playfair text-primary">
              Trinidad & Tobago Payroll Made Simple
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stop wrestling with spreadsheets and complex payroll calculations. Our specialized system handles TT employment law, NIS contributions, and local compliance — so you can focus on growing your business.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-primary/20 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-playfair">
                  <Calculator className="h-5 w-5 text-primary" />
                  Auto NIS Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatic 3% employee and 6.25% employer NIS contributions. No more manual calculations or compliance worries.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-playfair">
                  <Users className="h-5 w-5 text-primary" />
                  Multiple Pay Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Handle hourly, daily, and monthly employees seamlessly. Perfect for TT's diverse employment landscape.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-playfair">
                  <FileText className="h-5 w-5 text-primary" />
                  Ready Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Generate payroll summaries and employee reports in formats your accountant will love.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-playfair text-primary">Ready to Simplify Your Payroll?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join hundreds of TT business owners who trust our system for accurate, compliant payroll processing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <>
                    <Button size="lg" onClick={() => window.open('https://wa.me/18687773737?text=Hi! I\'m interested in learning more about your payroll system for my Trinidad & Tobago business.', '_blank')} className="bg-[#25D366] hover:bg-[#128C7E] text-white">
                      Get Started on WhatsApp
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setActiveTab('dashboard')}>
                      Explore the System
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" onClick={handleSignUpClick}>
                      Sign up to get started
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setActiveTab('dashboard')}>
                      Try the Demo
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-playfair">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Does this handle Trinidad & Tobago tax laws?</h4>
                <p className="text-muted-foreground">
                  Yes! Our system is built specifically for TT employment regulations, including current NIS contribution rates and local compliance requirements.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Can I track different types of employees?</h4>
                <p className="text-muted-foreground">
                  Absolutely. Whether you have hourly workers, daily employees, or monthly salaried staff, our system handles all employment types common in Trinidad & Tobago.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">What about my existing employee data?</h4>
                <p className="text-muted-foreground">
                  We can help you migrate your current employee information. Our team provides setup assistance to get you running smoothly from day one.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payroll Periods</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payrollPeriods.length}</div>
                <p className="text-xs text-muted-foreground">
                  Created periods
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TT NIS Rate</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3% / 6.25%</div>
                <p className="text-xs text-muted-foreground">
                  Employee / Employer contributions
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest payroll activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading data...</p>
                </div> : employees.length === 0 ? <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No employees added yet</p>
                  <Button onClick={() => setActiveTab('employees')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Employee
                  </Button>
                </div> : <div className="space-y-3">
                  {employees.slice(0, 5).map(employee => <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.employee_number} - {employee.employment_type}
                        </p>
                      </div>
                      <Badge variant="secondary">{employee.employment_type}</Badge>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Employee Management</h2>
              <p className="text-muted-foreground">Add and manage employee information</p>
            </div>
            <Button onClick={() => {
            setEditingEmployee(null);
            setShowEmployeeForm(true);
          }} disabled={loading || showEmployeeForm}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Employee
            </Button>
          </div>

          {showEmployeeForm ? <EmployeeForm onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee} onCancel={cancelForm} initialData={editingEmployee || undefined} loading={loading} /> : <Card>
              <CardHeader>
                <CardTitle>
                  {editingEmployee ? 'Edit Employee' : 'Employee List'}
                </CardTitle>
                <CardDescription>
                  {editingEmployee ? `Editing: ${editingEmployee.first_name} ${editingEmployee.last_name}` : `${employees.length} active employees`}
                </CardDescription>
              </CardHeader>
                <CardContent>
                {loading ? <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading employees...</p>
                  </div> : employees.length === 0 ? <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No employees added yet</p>
                    <Button onClick={() => setShowEmployeeForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Employee
                    </Button>
                  </div> : <div className="space-y-3">
                    {employees.map(employee => <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </h3>
                            <Badge variant="secondary">
                              {employee.employee_number}
                            </Badge>
                            <Badge variant="outline">
                              {employee.employment_type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Rate: {employee.employment_type === 'hourly' ? `${formatTTCurrency(employee.hourly_rate || 0)}/hr` : employee.employment_type === 'daily' ? `${formatTTCurrency(employee.daily_rate || 0)}/day` : `${formatTTCurrency(employee.monthly_salary || 0)}/month`}
                            {employee.email && ` • ${employee.email}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEditEmployee(employee)} disabled={loading || showEmployeeForm}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteEmployee(employee)} disabled={loading} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>)}
                  </div>}
              </CardContent>
            </Card>}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <div className="space-y-6">
            {/* Enhanced Calculator for authenticated users */}
            {user && (
              <EnhancedPayrollCalculator
                onCalculationComplete={handleCalculationComplete}
              />
            )}
            
            {/* Unified Calculator for all users */}
            <UnifiedPayrollCalculator
              employees={employees}
              onCalculationComplete={handleCalculationComplete}
              isDemo={isDemo}
            />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Payroll Reports</h2>
            <p className="text-muted-foreground">
              Generate and export payroll reports
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Download payroll data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={exportEmployeeData} variant="outline" disabled={employees.length === 0} className="h-20 flex-col gap-2">
                  <Download className="h-6 w-6" />
                  Employee Data (CSV)
                </Button>
                
                <Button variant="outline" disabled={true} className="h-20 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  Payroll Summary (Coming Soon)
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Employee Data: Export all employee information with rates and contact details</p>
                <p>• Payroll Summary: Detailed payroll calculations with NIS contributions (Coming Soon)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Lead capture modal */}
      {showLeadCapture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Get Started with Payroll</h2>
            <LeadCaptureForm 
              onSubmit={handleLeadCapture}
              isLoading={false}
            />
            <Button 
              variant="outline" 
              onClick={() => setShowLeadCapture(false)}
              className="w-full mt-4"
            >
              Maybe later
            </Button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Payroll;