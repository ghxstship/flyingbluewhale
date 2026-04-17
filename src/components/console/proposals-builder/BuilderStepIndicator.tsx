'use client';

import { Check } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BuilderStepIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function BuilderStepIndicator({
  steps,
  currentStep,
  onStepClick,
}: BuilderStepIndicatorProps) {
  return (
    <nav className="w-full overflow-x-auto pb-2">
      <ol className="flex items-center min-w-max gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <li key={index} className="flex items-center">
              <Button
                type="button"
                onClick={() => onStepClick(index)}
                className="flex items-center gap-2 group"
              >
                {/* Step circle */}
                <span
                  className={`
                    flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors
                    ${isCompleted ? 'bg-org-primary text-white' : ''}
                    ${isActive ? 'bg-org-primary text-white ring-2 ring-org-primary/30 ring-offset-2' : ''}
                    ${isPending ? 'bg-bg-tertiary text-text-muted group-hover:bg-border' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Step name */}
                <span
                  className={`
                    text-xs font-medium whitespace-nowrap transition-colors
                    ${isActive ? 'text-foreground' : ''}
                    ${isCompleted ? 'text-text-secondary' : ''}
                    ${isPending ? 'text-text-muted group-hover:text-text-secondary' : ''}
                  `}
                >
                  {step}
                </span>
              </Button>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    mx-3 h-px w-8 shrink-0
                    ${index < currentStep ? 'bg-org-primary' : 'bg-border'}
                  `}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
