"use client";

import { CalendarClock, Eye, MapPin } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Application } from "@/lib/types";
import { formatCurrency, formatDate, toTitle } from "@/lib/utils";

const statuses = [
  "SAVED",
  "APPLIED",
  "SHORTLISTED",
  "TEST_SCHEDULED",
  "TEST_COMPLETED",
  "INTERVIEW_SCHEDULED",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN"
];

function ApplicationCard({ application }: { application: Application }) {
  return (
    <div className="rounded-xl border bg-background/70 p-4 shadow-sm transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{application.drive.company.name}</div>
          <div className="mt-1 truncate text-sm text-muted-foreground">{application.drive.role}</div>
        </div>
        <StatusBadge status={application.eligibilityStatus} />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5" /> Deadline {formatDate(application.drive.applicationDeadline)}</div>
        <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {application.drive.location}</div>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            <Eye className="mr-2 h-4 w-4" />
            Quick view
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{application.drive.company.name}</DialogTitle>
            <DialogDescription>{application.drive.role}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3 rounded-xl border bg-muted/25 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>Status</span>
                <StatusBadge status={application.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Eligibility</span>
                <StatusBadge status={application.eligibilityStatus} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>CTC</span>
                <span className="font-medium">{formatCurrency(application.drive.ctc)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Applied on</span>
                <span className="font-medium">{formatDate(application.appliedAt)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {application.drive.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
            </div>
            <p className="rounded-xl border bg-background/60 p-4 text-sm leading-6 text-muted-foreground">
              {application.eligibilityReason}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ApplicationKanban({ applications }: { applications: Application[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {statuses.map((status) => {
        const grouped = applications.filter((application) => application.status === status);
        return (
          <Card key={status} className="soft-shadow min-h-64">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{toTitle(status)}</CardTitle>
              <Badge variant="secondary">{grouped.length}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3">
              {grouped.length ? (
                grouped.map((application) => <ApplicationCard key={application.id} application={application} />)
              ) : (
                <EmptyState
                  title="No applications here yet"
                  message="Applications will move into this column as the status changes."
                  className="min-h-40 border-0 bg-muted/20 p-4"
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
