'use client';

import { ComplianceActions } from '@/components/compliance-actions';

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          GDPR data export and deletion, data retention policy execution
        </p>
      </div>

      <ComplianceActions />
    </div>
  );
}
