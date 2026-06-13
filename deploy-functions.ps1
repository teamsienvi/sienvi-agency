$functions = @(
    "create-checkout-session",
    "create-custom-checkout-session",
    "stripe-webhook",
    "send-checkout-email",
    "send-login-invite",
    "send-contract-signed-email",
    "send-onboarding-complete-email",
    "send-admin-notification",
    "send-payment-confirmation",
    "create-client",
    "update-client",
    "get-admin-clients",
    "send-booking-email",
    "get-checkout-session",
    "create-customer-portal-session",
    "get-client-profile",
    "delete-client",
    "update-client-status",
    "send-reminders"
)

foreach ($fn in $functions) {
    Write-Host "Deploying $fn..." -ForegroundColor Cyan
    supabase functions deploy $fn --no-verify-jwt --use-api
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: $fn deployed" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: $fn" -ForegroundColor Red
    }
}

Write-Host "All deployments complete." -ForegroundColor Yellow
