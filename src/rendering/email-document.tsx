import type { Campaign } from "../core/schemas/index.js";
import { DispatchBlock } from "./dispatch-block.js";
import {
  complianceLinkStyle,
  complianceParagraphStyle,
  complianceStyle,
} from "./commerce-styles.js";
import {
  COMPLIANCE_VERSION,
  EMAIL_WIDTH,
  PHYSICAL_ADDRESS_PLACEHOLDER,
  RENDER_VERSION,
  UNSUBSCRIBE_PLACEHOLDER,
} from "./render-contract.js";
import {
  containerStyle,
  outerTableStyle,
  pageStyle,
  preheaderStyle,
  RESPONSIVE_CSS,
  shellCellStyle,
} from "./styles.js";

type EmailDocumentProps = {
  readonly campaign: Campaign;
};

/** Renders Punch-owned compliance chrome after all generated blocks. */
function ComplianceFooter() {
  return (
    <tr data-punch-compliance={COMPLIANCE_VERSION}>
      <td data-punch-text-role="compliance" style={complianceStyle}>
        <p data-punch-text-role="compliance" style={complianceParagraphStyle}>
          {PHYSICAL_ADDRESS_PLACEHOLDER}
        </p>
        <p data-punch-text-role="compliance" style={complianceParagraphStyle}>
          <a
            data-punch-text-role="compliance-link"
            href={UNSUBSCRIBE_PLACEHOLDER}
            style={complianceLinkStyle}
          >
            Unsubscribe
          </a>
        </p>
      </td>
    </tr>
  );
}

/** Renders the fixed-width campaign table and owned compliance footer. */
function CampaignContainer({ campaign }: EmailDocumentProps) {
  return (
    <table
      border={0}
      cellPadding={0}
      cellSpacing={0}
      className="punch-email-container"
      role="presentation"
      style={containerStyle}
      width={EMAIL_WIDTH}
    >
      <tbody>
        {campaign.blocks.map((block) => (
          <DispatchBlock block={block} key={block.id} />
        ))}
        <ComplianceFooter />
      </tbody>
    </table>
  );
}

/** Centres the campaign container on the email page background. */
function EmailCanvas({ campaign }: EmailDocumentProps) {
  return (
    <table
      border={0}
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={outerTableStyle}
      width="100%"
    >
      <tbody>
        <tr>
          <td
            align="center"
            className="punch-shell-cell"
            style={shellCellStyle}
          >
            <CampaignContainer campaign={campaign} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Builds the standalone email document around validated semantic blocks. */
export function EmailDocument({ campaign }: EmailDocumentProps) {
  return (
    <html data-punch-render={RENDER_VERSION} lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="light" name="color-scheme" />
        <meta content="light" name="supported-color-schemes" />
        <meta content="yes" name="x-apple-disable-message-reformatting" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{campaign.subject}</title>
        <style>{RESPONSIVE_CSS}</style>
      </head>
      <body style={pageStyle}>
        <div
          data-punch-preheader="v1"
          data-punch-text-role="preheader"
          style={preheaderStyle}
        >
          {campaign.preheader}
        </div>
        <EmailCanvas campaign={campaign} />
      </body>
    </html>
  );
}
