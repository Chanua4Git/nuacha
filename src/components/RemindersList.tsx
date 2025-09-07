
import { useExpense } from '@/context/ExpenseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlarmClock, Tag, ArrowRightCircle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

const RemindersList = () => {
  const { upcomingReminders } = useExpense();
  
  const reminders = upcomingReminders();
  
  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No upcoming reminders</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Upcoming Reminders</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {reminders.map((reminder) => {
            const today = new Date();
            const dueDate = parseISO(reminder.dueDate);
            const daysLeft = differenceInDays(dueDate, today);
            
            let status: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
            if (daysLeft <= 0) {
              status = 'destructive';
            } else if (daysLeft <= 3) {
              status = 'secondary';
            }
            
            return (
              <div key={reminder.id} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{reminder.title}</h3>
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{format(parseISO(reminder.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div>
                    <Badge variant={status}>
                      {daysLeft <= 0 ? 'Due' : `${daysLeft} days left`}
                    </Badge>
                    {reminder.isRecurring && (
                      <div className="mt-1 text-xs text-muted-foreground flex items-center justify-end">
                        <ArrowRightCircle className="h-3 w-3 mr-1" />
                        <span>Recurring</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {reminder.type === 'bill' ? (
                      <>
                        <AlarmClock className="h-3 w-3 mr-1" />
                        <span>Bill Payment</span>
                      </>
                    ) : (
                      <>
                        <Tag className="h-3 w-3 mr-1" />
                        <span>Item Replacement</span>
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemindersList;
