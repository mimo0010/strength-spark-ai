import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Info, AlertCircle, Trash2, Terminal } from 'lucide-react';
import { apiLogger, type ApiEvent } from '@/lib/apiLogger';

const statusIcon = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const statusBadgeVariant: Record<ApiEvent['status'], 'default' | 'destructive' | 'secondary'> = {
  success: 'default',
  error: 'destructive',
  info: 'secondary',
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString();
};

const ApiStatusConsole = () => {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<ApiEvent[]>(apiLogger.getEvents());
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'info'>('all');

  useEffect(() => {
    return apiLogger.subscribe(setEvents);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return events.slice().reverse();
    return events.filter((e) => e.status === filter).slice().reverse();
  }, [events, filter]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="shadow-md border-primary/50 text-primary hover:bg-primary/10"
          aria-label="Open API status console"
        >
          <Terminal className="w-4 h-4 mr-2" />
          API Console
          {events.length > 0 && (
            <Badge className="ml-2" variant="secondary">{events.length}</Badge>
          )}
        </Button>
      )}

      {open && (
        <Card className="bg-glass border-glass backdrop-blur-sm shadow-glow w-[360px] max-w-[90vw]">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">API Status</h4>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-background border rounded px-2 py-1 text-sm"
                aria-label="Filter events"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="info">Info</option>
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => apiLogger.clear()}
                title="Clear events"
                aria-label="Clear events"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)} aria-label="Close">
                Close
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[320px]">
            <ul className="p-3 space-y-2">
              {filtered.length === 0 && (
                <li className="text-sm text-muted-foreground">No events yet.</li>
              )}
              {filtered.map((evt) => {
                const Icon = statusIcon[evt.status];
                return (
                  <li key={evt.id} className="p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${
                          evt.status === 'success'
                            ? 'text-primary'
                            : evt.status === 'error'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`} />
                        <div>
                          <div className="text-sm font-medium">
                            {evt.source} • {evt.action}
                          </div>
                          <div className="text-sm text-muted-foreground">{evt.message}</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                        {formatTime(evt.timestamp)}
                      </div>
                    </div>
                    {evt.meta && (
                      <pre className="mt-2 text-xs text-muted-foreground/90 overflow-x-auto">
                        {JSON.stringify(evt.meta, null, 2)}
                      </pre>
                    )}
                    <div className="mt-2">
                      <Badge variant={statusBadgeVariant[evt.status]} className="text-[10px] uppercase tracking-wide">
                        {evt.status}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};

export default ApiStatusConsole;
