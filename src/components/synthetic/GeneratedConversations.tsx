import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { format } from 'date-fns';
import { Download, Eye, MessageSquare, Clock } from 'lucide-react';

interface GeneratedChatlog {
  id: string;
  chatlog: string;
  scenario: string;
  shift: string;
  dateTime: string;
  customerName: string;
  coherence?: number;
  politeness?: number;
  relevance?: number;
  resolution?: number;
  escalated?: boolean;
  evaluated: boolean;
  actions?: never;
}

interface GeneratedConversationsProps {
  conversations: GeneratedChatlog[];
  onViewConversation: (conversation: GeneratedChatlog) => void;
  onExportConversations: () => void;
}

export function GeneratedConversations({
  conversations,
  onViewConversation,
  onExportConversations,
}: GeneratedConversationsProps) {
  const columns = [
    {
      key: 'dateTime' as keyof GeneratedChatlog,
      header: 'Date & Time',
      render: (value: string) => format(new Date(value), 'MMM d, yyyy HH:mm'),
      sortable: true,
    },
    {
      key: 'customerName' as keyof GeneratedChatlog,
      header: 'Customer',
      sortable: true,
    },
    {
      key: 'scenario' as keyof GeneratedChatlog,
      header: 'Scenario',
      sortable: true,
    },
    {
      key: 'shift' as keyof GeneratedChatlog,
      header: 'Shift',
      sortable: true,
    },
    {
      key: 'evaluated' as keyof GeneratedChatlog,
      header: 'Metrics',
      render: (_: boolean, item: GeneratedChatlog) => (
        <div className="flex gap-1">
          {item.coherence !== undefined && (
            <Badge variant="secondary" className="text-xs">
              C: {(item.coherence * 100).toFixed(0)}%
            </Badge>
          )}
          {item.politeness !== undefined && (
            <Badge variant="secondary" className="text-xs">
              P: {(item.politeness * 100).toFixed(0)}%
            </Badge>
          )}
          {item.relevance !== undefined && (
            <Badge variant="secondary" className="text-xs">
              R: {(item.relevance * 100).toFixed(0)}%
            </Badge>
          )}
          {item.resolution !== undefined && (
            <Badge variant="secondary" className="text-xs">
              S: {(item.resolution * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions' as keyof GeneratedChatlog,
      header: 'Actions',
      render: (_: any, item: GeneratedChatlog) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewConversation(item);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated Conversations</CardTitle>
        <Button variant="outline" size="sm" onClick={onExportConversations}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={conversations}
          columns={columns}
          searchable
          searchKeys={['customerName', 'scenario', 'shift']}
          onRowClick={onViewConversation}
          itemsPerPageOptions={[10, 25, 50]}
        />
      </CardContent>
    </Card>
  );
} 