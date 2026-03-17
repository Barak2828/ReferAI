"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
    label: string;
    description?: string;
}

interface ProgressStepperProps {
    steps: Step[];
    currentStep: number;
}

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
    return (
        <div className="flex items-center w-full">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div key={step.label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2",
                                    isCompleted
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : isCurrent
                                            ? "border-primary text-primary bg-primary/10"
                                            : "border-border text-muted-foreground bg-secondary"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <div className="text-center">
                                <p className={cn(
                                    "text-xs font-medium",
                                    isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </p>
                            </div>
                        </div>

                        {index < steps.length - 1 && (
                            <div className="flex-1 mx-3 mt-[-1.5rem]">
                                <div className={cn(
                                    "h-0.5 rounded-full transition-all duration-300",
                                    isCompleted
                                        ? "bg-gradient-to-r from-primary to-primary"
                                        : "bg-border"
                                )} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
