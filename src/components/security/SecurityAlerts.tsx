
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, AlertTriangle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityAlert {
  id: string;
  type: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const SecurityAlerts = () => {
  const { isAdmin } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadSecurityAlerts();
      // Refresh alerts every 30 seconds
      const interval = setInterval(loadSecurityAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const loadSecurityAlerts = async () => {
    try {
      setLoading(true);
      
      // Get recent failed login attempts (last 24 hours)
      const { data: failedLogins, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('success', false)
        .gte('attempted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('attempted_at', { ascending: false });

      if (!error && failedLogins) {
        const newAlerts: SecurityAlert[] = [];
        
        // Group failed attempts by IP
        const ipGroups: Record<string, any[]> = {};
        failedLogins.forEach(attempt => {
          const ip = String(attempt.ip_address || 'unknown');
          if (!ipGroups[ip]) ipGroups[ip] = [];
          ipGroups[ip].push(attempt);
        });

        // Create alerts for suspicious activity
        Object.entries(ipGroups).forEach(([ip, attempts]) => {
          if (attempts.length >= 5) {
            newAlerts.push({
              id: `suspicious-ip-${ip}`,
              type: attempts.length >= 10 ? 'high' : 'medium',
              message: `${attempts.length} tentativas de login falhadas do IP ${ip} nas últimas 24h`,
              timestamp: attempts[0].attempted_at,
              resolved: false
            });
          }
        });

        // Group by email
        const emailGroups: Record<string, any[]> = {};
        failedLogins.forEach(attempt => {
          const email = String(attempt.email);
          if (!emailGroups[email]) emailGroups[email] = [];
          emailGroups[email].push(attempt);
        });

        Object.entries(emailGroups).forEach(([email, attempts]) => {
          if (attempts.length >= 3) {
            newAlerts.push({
              id: `suspicious-email-${email}`,
              type: attempts.length >= 5 ? 'high' : 'medium',
              message: `${attempts.length} tentativas de login falhadas para ${email} nas últimas 24h`,
              timestamp: attempts[0].attempted_at,
              resolved: false
            });
          }
        });

        setAlerts(newAlerts);
      }
    } catch (error) {
      console.error('Error loading security alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'high':
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!isAdmin) {
    return null;
  }

  const visibleAlerts = showResolved ? alerts : alerts.filter(alert => !alert.resolved);
  const unresolvedCount = alerts.filter(alert => !alert.resolved).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Alertas de Segurança
              {unresolvedCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unresolvedCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Monitoramento de atividades suspeitas em tempo real
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Ocultar Resolvidos
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Mostrar Resolvidos
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSecurityAlerts}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleAlerts.length === 0 ? (
            <Alert>
              <AlertDescription>
                {showResolved ? 'Nenhum alerta encontrado.' : 'Nenhum alerta ativo no momento.'}
              </AlertDescription>
            </Alert>
          ) : (
            visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getAlertColor(alert.type)} ${
                  alert.resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={alert.resolved ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {alert.resolved ? 'Resolvido' : alert.type.toUpperCase()}
                  </Badge>
                  {!alert.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
