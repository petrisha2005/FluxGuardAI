import { CopilotPanel } from '../dashboard/components/CopilotPanel';
import { DashboardHeader } from '../dashboard/components/DashboardHeader';

export function CopilotPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <div className="max-w-4xl mx-auto">
        <CopilotPanel className="h-[650px]" />
      </div>
    </div>
  );
}
