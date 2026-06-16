import { Body, Controller, Get, Param, Put, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Stage3Service } from "./stage3.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminSaasController {
  constructor(private readonly stage3: Stage3Service) {}

  @Get("saas-dashboard")
  dashboard() {
    return this.stage3.adminSaasDashboard();
  }

  @Get("organizations")
  organizations(@Query() query: Record<string, string | undefined>) {
    return this.stage3.adminOrganizations(query);
  }

  @Get("organizations/:id")
  organization(@Param("id") id: string) {
    return this.stage3.adminOrganization(id);
  }

  @Put("organizations/:id/status")
  status(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.stage3.setOrganizationStatus(id, body, user.id);
  }

  @Get("subscriptions")
  subscriptions() {
    return this.stage3.adminSubscriptions();
  }

  @Put("subscriptions/:id/override")
  override(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.stage3.overrideSubscription(id, body, user.id);
  }

  @Get("payments")
  payments() {
    return this.stage3.adminPayments();
  }

  @Get("revenue")
  revenue() {
    return this.stage3.adminRevenue();
  }

  @Get("account-logs")
  logs() {
    return this.stage3.adminAccountLogs();
  }
}
