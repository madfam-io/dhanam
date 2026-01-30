import { AlertTriangle, CheckCircle } from 'lucide-react';

export function ProblemSolution() {
  return (
    <section className="container mx-auto px-6 py-16 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Traditional Apps Tell You Where Your Money Went.
          <br />
          <span className="text-primary">Dhanam Tells You Where It&apos;s Going.</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-card p-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Budget Trackers</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-red-600">✗</span> Static projections
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">✗</span> No probability
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">✗</span> Can&apos;t stress test
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">✗</span> Backward-looking only
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">✗</span> Manual categorization
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">✗</span> Banks only — no crypto, collectibles, or
                gaming
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-card p-6">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="h-5 w-5" />
              <h3 className="font-semibold">Dhanam</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> 10,000 Monte
                Carlo iterations
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Probability-based
                planning
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> 12 historical
                stress scenarios
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> AI-powered
                forecasting &amp; categorization
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Banks, crypto,
                DeFi, real estate, collectibles, gaming
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> Estate planning
                with Life Beat dead man&apos;s switch
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
