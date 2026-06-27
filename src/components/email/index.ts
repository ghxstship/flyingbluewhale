/**
 * ATLVS Email Kit — barrel export.
 *
 * A self-contained, no-React string kit for building transactional and
 * campaign emails as table-based, fully-inline-styled HTML. See README.md
 * in this directory for usage and the rationale behind inline hex.
 */

export {
  PALETTE,
  FONTS,
  escapeHtml,
  emailButton,
  emailHeading,
  emailText,
  emailEyebrow,
  emailDivider,
  emailSpacer,
  emailCodePanel,
  emailHeader,
  emailFooter,
  type PaletteColor,
  type ButtonTone,
} from "./blocks";

export { emailLayout, type EmailLayoutOptions } from "./layout";

export {
  welcomeEmail,
  verifyEmail,
  inviteEmail,
  announcementEmail,
  type RenderedEmail,
} from "./templates";

export {
  EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_IDS,
  type EmailTemplateId,
  type EmailTemplateEntry,
} from "./registry";
