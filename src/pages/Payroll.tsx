import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calculator, FileText, Download, Loader2 } from 'lucide-react';
import { EmployeeForm } from '@/components/payroll/EmployeeForm';
import { PayrollCalculator } from '@/components/payroll/PayrollCalculator';
import { useSupabasePayroll } from '@/hooks/useSupabasePayroll';
import { Employee, PayrollEntry } from '@/types/payroll';
import { formatTTCurrency } from '@/utils/payrollCalculations';

const Payroll: React.FC = () => {
  const {
    employees,
    payrollPeriods,
    payrollEntries,
    loading,
    addEmployee,
    addPayrollPeriod,
    addPayrollEntry,
    getEntriesForPeriod,
  } = useSupabasePayroll();

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleAddEmployee = async (data: any) => {
    const result = await addEmployee({
      ...data,
      is_active: true,
    });
    if (result) {
      setShowEmployeeForm(false);
    }
  };

  const handleCalculationComplete = (employee: Employee, calculation: any, input: any) => {
    // For now, just show success - in real app would save to payroll period
    console.log('Payroll calculated:', { employee, calculation, input });
  };

  const exportEmployeeData = () => {
    if (employees.length === 0) return;

    const csvHeader = 'Employee Number,First Name,Last Name,Employment Type,Rate,Email,Phone,NIS Number\n';
    const csvData = employees.map(emp => [
      emp.employee_number,
      emp.first_name,
      emp.last_name,
      emp.employment_type,
      emp.employment_type === 'hourly' ? emp.hourly_rate :
      emp.employment_type === 'daily' ? emp.daily_rate :
      emp.monthly_salary,
      emp.email || '',
      emp.phone || '',
      emp.nis_number || '',
    ].join(',')).join('\n');

    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

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
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading data...</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No employees added yet</p>
                  <Button onClick={() => setActiveTab('employees')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Employee
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {employees.slice(0, 5).map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.employee_number} - {employee.employment_type}
                        </p>
                      </div>
                      <Badge variant="secondary">{employee.employment_type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Employee Management</h2>
              <p className="text-muted-foreground">Add and manage employee information</p>
            </div>
            <Button onClick={() => setShowEmployeeForm(true)} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Employee
            </Button>
          </div>

          {showEmployeeForm ? (
            <EmployeeForm
              onSubmit={handleAddEmployee}
              onCancel={() => setShowEmployeeForm(false)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Employee List</CardTitle>
                <CardDescription>
                  {employees.length} active employees
                </CardDescription>
              </CardHeader>
                <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading employees...</p>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No employees added yet</p>
                    <Button onClick={() => setShowEmployeeForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Employee
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                            Rate: {
                              employee.employment_type === 'hourly' ? `${formatTTCurrency(employee.hourly_rate || 0)}/hr` :
                              employee.employment_type === 'daily' ? `${formatTTCurrency(employee.daily_rate || 0)}/day` :
                              `${formatTTCurrency(employee.monthly_salary || 0)}/month`
                            }
                            {employee.email && ` • ${employee.email}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Payroll Calculator</h2>
            <p className="text-muted-foreground">
              Calculate individual employee payroll with TT NIS contributions
            </p>
          </div>

          {employees.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You need to add employees before calculating payroll
                </p>
                <Button onClick={() => setActiveTab('employees')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employees First
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PayrollCalculator
              employees={employees}
              onCalculationComplete={handleCalculationComplete}
            />
          )}
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
                <Button 
                  onClick={exportEmployeeData} 
                  variant="outline" 
                  disabled={employees.length === 0}
                  className="h-20 flex-col gap-2"
                >
                  <Download className="h-6 w-6" />
                  Employee Data (CSV)
                </Button>
                
                <Button 
                  variant="outline" 
                  disabled={true}
                  className="h-20 flex-col gap-2"
                >
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
  );
};

export default Payroll;