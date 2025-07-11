import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server } from "lucide-react";
import { apiClient } from '../lib/api';

export default function BackendSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Server className="inline-block mr-2" /> Backend Settings
        </CardTitle>
        <CardDescription>
          The backend URL currently in use by the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <strong>Backend URL:</strong> {apiClient.getBackendUrl()}
        </div>
      </CardContent>
    </Card>
  );
} 