
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const checks = [
    { label: 'Pelo menos 8 caracteres', test: password.length >= 8 },
    { label: 'Letra maiúscula', test: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', test: /[a-z]/.test(password) },
    { label: 'Número', test: /\d/.test(password) },
    { label: 'Caractere especial', test: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const passedChecks = checks.filter(check => check.test).length;
  const strength = (passedChecks / checks.length) * 100;

  const getStrengthLabel = () => {
    if (passedChecks <= 2) return 'Fraca';
    if (passedChecks <= 3) return 'Média';
    if (passedChecks <= 4) return 'Forte';
    return 'Muito Forte';
  };

  const getStrengthColor = () => {
    if (passedChecks <= 2) return 'bg-red-500';
    if (passedChecks <= 3) return 'bg-yellow-500';
    if (passedChecks <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Força da senha:</span>
        <span className={`text-sm font-medium ${
          passedChecks <= 2 ? 'text-red-600' :
          passedChecks <= 3 ? 'text-yellow-600' :
          passedChecks <= 4 ? 'text-blue-600' : 'text-green-600'
        }`}>
          {getStrengthLabel()}
        </span>
      </div>
      
      <Progress value={strength} className="h-2" />
      
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {check.test ? (
              <CheckCircle className="h-3 w-3 text-green-600" />
            ) : (
              <XCircle className="h-3 w-3 text-red-600" />
            )}
            <span className={check.test ? 'text-green-600' : 'text-red-600'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
