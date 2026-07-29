import type { Campaign } from "../core/schemas/index.js";
import { DispatchBlock } from "./dispatch-block.js";
import {
  COMPLIANCE_VERSION,
  EMAIL_WIDTH,
  PHYSICAL_ADDRESS_PLACEHOLDER,
  RENDER_VERSION,
  UNSUBSCRIBE_PLACEHOLDER,
} from "./render-contract.js";
import {
  complianceLinkStyle,
  complianceParagraphStyle,
  complianceStyle,
  containerStyle,
  outerTableStyle,
  pageStyle,
  preheaderStyle,
  RESPONSIVE_CSS,
} from "./styles.js";

type EmailDocumentProps = {
  readonly campaign: Campaign;
};

/** Renders Punch-owned compliance chrome after all generated blocks. */
function ComplianceFooter() {
  return (
    <tr data-punch-compliance={COMPLIANCE_VERSION}>
      <td style={complianceStyle}>
        <p style={complianceParagraphStyle}>{PHYSICAL_ADDRESS_PLACEHOLDER}</p>
        <p style={complianceParagraphStyle}>
          <a href={UNSUBSCRIBE_PLACEHOLDER} style={complianceLinkStyle}>
            Unsubscribe
          </a>
        </p>
      </td>
    </tr>
  );
}

/** Builds the standalone email document around validated semantic blocks. */
export function EmailDocument({ campaign }: EmailDocumentProps) {
  return (
    <html data-punch-render={RENDER_VERSION} lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <title>{campaign.subject}</title>
        <style>{RESPONSIVE_CSS}</style>
      </head>
      <body style={pageStyle}>
        <div data-punch-preheader="v1" style={preheaderStyle}>
          {campaign.preheader}
        </div>
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
              <td align="center">
                <table
                  border={0}
                  cellPadding={0}
                  cellSpacing={0}
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
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
