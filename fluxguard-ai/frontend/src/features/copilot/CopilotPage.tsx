import { CopilotPanel } from '../dashboard/components/CopilotPanel';
import { DashboardHeader } from '../dashboard/components/DashboardHeader';

export function CopilotPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <div className="max-w-6xl mx-auto">
        <CopilotPanel className="min-h-[680px]" />
      </div>
    </div>
  );
}
