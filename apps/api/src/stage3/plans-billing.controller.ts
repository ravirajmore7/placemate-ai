import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Stage3Service } from "./stage3.service";

@Controller("plans")
export class PlansController {
  constructor(private readonly stage3: Stage3Service) {}

  @Get()
  plans() {
    return this.stage3.plans();
  }

  @Get(":code")
  plan(@Param("code") code: string) {
    return this.stage3.plan(code);
  }
}

@Controller("billing")
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly stage3: Stage3Service) {}

  @Post("create-checkout")
  createCheckout(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.createCheckout(user, body);
  }

  @Post("create-subscription")
  createSubscription(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.createCheckout(user, body);
  }

  @Get("current")
  current(@CurrentUser() user: AuthUser) {
    return this.stage3.billing(user);
  }

  @Get("payments")
  payments(@CurrentUser() user: AuthUser) {
    return this.stage3.billing(user).then((billing) => billing.payments);
  }

  @Get("invoices")
  invoices(@CurrentUser() user: AuthUser) {
    return this.stage3.billing(user).then((billing) => billing.invoices);
  }

  @Post("cancel")
  cancel(@CurrentUser() user: AuthUser) {
    return this.stage3.cancelBilling(user);
  }

  @Post("change-plan")
  changePlan(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.changePlan(user, body);
  }
}

@Controller("payments/razorpay")
@UseGuards(JwtAuthGuard)
export class RazorpayPaymentsController {
  constructor(private readonly stage3: Stage3Service) {}

  @Post("verify")
  verify(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.verifyRazorpayPayment(user, body);
  }
}

@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly stage3: Stage3Service) {}

  @Post("razorpay")
  razorpay(@Req() req: Request & { rawBody?: Buffer }, @Headers("x-razorpay-signature") signature: string, @Body() body: Record<string, unknown>) {
    return this.stage3.razorpayWebhook(req.rawBody, signature, body);
  }
}

@Controller("usage")
@UseGuards(JwtAuthGuard)
export class UsageController {
  constructor(private readonly stage3: Stage3Service) {}

  @Get("current")
  current(@CurrentUser() user: AuthUser) {
    return this.stage3.usageSummary(user);
  }

  @Post("check")
  check(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.usageCheck(user, body);
  }

  @Post("increment")
  increment(@CurrentUser() user: AuthUser, @Body() body: Record<string, unknown>) {
    return this.stage3.usageIncrement(user, body);
  }
}
