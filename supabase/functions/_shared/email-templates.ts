// Shared email template components for consistent styling across all emails

export const emailStyles = {
  primary: "#667eea",
  primaryDark: "#5a67d8",
  accent: "#764ba2",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#1f2937",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  bgLight: "#f9fafb",
  bgCard: "#ffffff",
  border: "#e5e7eb",
};

export const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sienvi</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${emailStyles.primary};">Sienvi</h1>
            </td>
          </tr>
          ${content}
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: ${emailStyles.textMuted};">
                Questions? Reply to this email or contact us at
              </p>
              <a href="mailto:teamsienvi@gmail.com" style="color: ${emailStyles.primary}; text-decoration: none; font-size: 14px;">teamsienvi@gmail.com</a>
              <p style="margin: 24px 0 0 0; font-size: 12px; color: ${emailStyles.textMuted};">
                © ${new Date().getFullYear()} Sienvi. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const getEmailCard = (content: string) => `
<tr>
  <td style="background: ${emailStyles.bgCard}; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
    ${content}
  </td>
</tr>
`;

export const getEmailHeader = (title: string, subtitle?: string) => `
<div style="background: linear-gradient(135deg, ${emailStyles.primary} 0%, ${emailStyles.accent} 100%); padding: 32px 40px; text-align: center;">
  <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">${title}</h2>
  ${subtitle ? `<p style="margin: 8px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">${subtitle}</p>` : ""}
</div>
`;

export const getEmailButton = (text: string, url: string, variant: "primary" | "success" = "primary") => {
  const bgColor = variant === "success" 
    ? `linear-gradient(135deg, ${emailStyles.success} 0%, #059669 100%)`
    : `linear-gradient(135deg, ${emailStyles.primary} 0%, ${emailStyles.accent} 100%)`;
  
  return `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding: 24px 0;">
      <a href="${url}" style="display: inline-block; background: ${bgColor}; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;
};

export const getInfoBox = (content: string, variant: "info" | "success" | "warning" = "info") => {
  const colors = {
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
    success: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  };
  const c = colors[variant];
  
  return `
<div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="margin: 0; font-size: 14px; color: ${c.text};">${content}</p>
</div>
`;
};

export const getPlanDetailsCard = (plan: string, price: number | string) => `
<div style="background: ${emailStyles.bgLight}; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid ${emailStyles.border};">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-bottom: 12px; border-bottom: 1px solid ${emailStyles.border};">
        <span style="font-size: 14px; color: ${emailStyles.textSecondary}; text-transform: uppercase; letter-spacing: 0.5px;">Your Plan</span>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 12px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="font-size: 18px; font-weight: 600; color: ${emailStyles.textPrimary};">${plan}</span>
            </td>
            <td align="right">
              <span style="font-size: 18px; font-weight: 700; color: ${emailStyles.primary};">$${typeof price === 'number' ? price.toLocaleString() : price}/mo</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
`;

export const getStepsList = (steps: { title: string; completed?: boolean }[]) => `
<div style="margin: 24px 0;">
  ${steps.map((step, i) => `
    <div style="display: flex; align-items: flex-start; margin-bottom: ${i < steps.length - 1 ? '16px' : '0'};">
      <div style="flex-shrink: 0; width: 28px; height: 28px; background: ${step.completed ? emailStyles.success : emailStyles.primary}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
        <span style="color: #ffffff; font-size: 14px; font-weight: 600;">${step.completed ? '✓' : i + 1}</span>
      </div>
      <span style="font-size: 15px; color: ${step.completed ? emailStyles.textMuted : emailStyles.textPrimary}; padding-top: 4px; ${step.completed ? 'text-decoration: line-through;' : ''}">${step.title}</span>
    </div>
  `).join('')}
</div>
`;
