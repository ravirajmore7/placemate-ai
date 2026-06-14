"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Application } from "@/lib/types";
import { toTitle } from "@/lib/utils";

const statuses = ["APPLIED", "SHORTLISTED", "TEST_SCHEDULED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED"];

export function ApplicationKanban({ applications }: { applications: Application[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {statuses.map((status) => (
        <Card key={status}>
          <CardHeader>
            <CardTitle className="text-sm">{toTitle(status)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {applications.filter((application) => application.status === status).map((application) => (
              <div key={application.id} className="rounded-md border bg-muted/30 p-3">
                <div className="font-medium">{application.drive.company.name}</div>
                <div className="text-sm text-muted-foreground">{application.drive.role}</div>
                <Badge className="mt-2" variant="outline">{toTitle(application.eligibilityStatus)}</Badge>
              </div>
            ))}
            {applications.filter((application) => application.status === status).length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications here yet.</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
