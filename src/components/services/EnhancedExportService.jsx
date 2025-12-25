// ENHANCED EXPORT SERVICE
// Modern dark/gold invoice design with signature field, terms & conditions

export class EnhancedExportService {
  constructor(formData, calculations, dayRates, gearCosts, settings, isUnlocked = true) {
    this.formData = formData;
    this.calc = calculations;
    this.dayRates = dayRates;
    this.gearCosts = gearCosts;
    this.settings = settings;
    this.isUnlocked = isUnlocked;
  }

  // Format date helper
  _formatDate(date, formatStr) {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  // Format shoot dates
  formatShootDates() {
    const { shoot_dates } = this.formData;
    if (!shoot_dates || shoot_dates.length === 0) return "TBD";
    
    const sortedDates = [...shoot_dates].sort((a, b) => new Date(a) - new Date(b));
    
    if (sortedDates.length === 1) {
      return this._formatDate(sortedDates[0]);
    }
    
    if (sortedDates.length === 2) {
      return `${this._formatDate(sortedDates[0])} - ${this._formatDate(sortedDates[1])}`;
    }
    
    return `${this._formatDate(sortedDates[0])} - ${this._formatDate(sortedDates[sortedDates.length - 1])} (${sortedDates.length} days)`;
  }

  // Generate Ledger-style HTML (Quote or Invoice - same design, different state)
  generateHTML(documentType = 'invoice') {
    const shootDatesText = this.formatShootDates();
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const docNumber = `TK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    const companyName = this.settings?.company_name || "NVision Video Production";
    const companyLogo = this.settings?.company_logo || "";
    const companyPhone = this.settings?.company_phone || "";
    const companyEmail = this.settings?.company_email || "";
    const companyWebsite = this.settings?.company_website || "";
    const companyAddress = this.settings?.company_address || "";
    const termsAndConditions = this.settings?.terms_and_conditions || "";
    const notesToCustomer = this.settings?.notes_to_customer || "";
    const showSignature = this.settings?.show_signature_field !== false;
    const showPaymentSchedule = this.settings?.show_payment_schedule !== false;

    const rawLineItems = Array.isArray(this.calc?.lineItems) ? this.calc.lineItems : [];

    const combinedLineItems = (() => {
      const out = [];
      const byKey = new Map();

      for (const item of rawLineItems) {
        if (item?.isSection) {
          out.push(item);
          continue;
        }

        const qty = typeof item?.quantity === 'number' ? item.quantity : 1;
        const unitPrice = typeof item?.unitPrice === 'number'
          ? item.unitPrice
          : (qty > 0 ? (Number(item?.amount || 0) / qty) : Number(item?.amount || 0));

        const key = `${item?.description || ''}::${unitPrice.toFixed(4)}`;
        const existing = byKey.get(key);
        if (!existing) {
          const next = {
            ...item,
            quantity: qty,
            unitPrice,
            amount: Number(item?.amount || 0),
          };
          byKey.set(key, next);
          out.push(next);
        } else {
          existing.quantity = Number(existing.quantity || 0) + Number(qty || 0);
          existing.amount = Number(existing.amount || 0) + Number(item?.amount || 0);
        }
      }

      return out;
    })();

    const targetTotal = Number(this.calc?.total || 0);

    // Line items already include any discounts/adjustments from the calculation engine
    // Only add a reconciliation row if there's a significant mismatch (>$1)
    const tableSum = combinedLineItems
      .filter(i => !i?.isSection)
      .reduce((s, i) => s + (Number(i?.amount || 0)), 0);
    const diff = targetTotal - tableSum;

    const displayLineItems = (() => {
      if (!Number.isFinite(diff) || Math.abs(diff) < 1.00) return combinedLineItems;
      const next = [...combinedLineItems];
      const label = diff < 0 ? 'Discount' : 'Service Fee';
      next.push({ description: label, amount: diff, quantity: 1, unitPrice: diff });
      return next;
    })();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${documentType === 'invoice' ? 'Invoice' : 'Quote'} - ${this.formData.project_title || 'Untitled'}</title>
        <style>${this._getEnhancedStyles()}</style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="header-left">
            <div class="ledger-title">TurnKey Pricing Ledger</div>
            <div class="ledger-subtitle">${documentType === 'invoice' ? 'Invoice Record' : 'Quote Record'}</div>
          </div>
          <div class="header-right">
            <div class="meta-row"><span class="meta-label">${documentType === 'invoice' ? 'Invoice ID:' : 'Quote ID:'}</span> <span class="meta-value">${docNumber}</span></div>
            <div class="meta-row"><span class="meta-label">${documentType === 'invoice' ? 'Decision Date:' : 'Draft Date:'}</span> <span class="meta-value">${currentDate}</span></div>
            <div class="meta-row"><span class="meta-label">Status:</span> <span class="meta-value">${documentType === 'invoice' ? 'Final' : 'Unfinalized'}</span></div>
          </div>
        </div>

        <div class="context-block">
          <div class="context-row"><span class="context-label">Client:</span> <span class="context-value">${this.formData.client_name || '[Client Name]'}</span></div>
          ${this.formData.project_title ? `<div class="context-row"><span class="context-label">Project Reference:</span> <span class="context-value">${this.formData.project_title}</span></div>` : ''}
          <div class="context-row"><span class="context-label">Prepared By:</span> <span class="context-value">${companyName}</span></div>
          <div class="context-row"><span class="context-label">Currency:</span> <span class="context-value">USD</span></div>
        </div>


        <table class="ledger-table">
          <thead>
            <tr>
              <th class="col-items">Item</th>
              <th class="col-type">Type</th>
              <th class="col-qty">Quantity</th>
              <th class="col-price">Rate</th>
              <th class="col-total">Recorded Total</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              let lineNumber = 0;
              return (displayLineItems || []).map((item, index) => {
                if (item?.isSection) {
                  return '';
                }

                lineNumber += 1;
                const mainDesc = (item.description || '').split(' - ')[0];
                const amount = Number(item.amount || 0);
                const qty = typeof item?.quantity === 'number' ? item.quantity : 1;
                const unitPrice = typeof item?.unitPrice === 'number'
                  ? item.unitPrice
                  : (qty > 0 ? (amount / qty) : amount);
                
                const itemType = amount < 0 ? 'Adjustment' : (qty > 1 ? 'Decision' : 'Decision');
                
                return `
                <tr>
                  <td class="col-items">${mainDesc}</td>
                  <td class="col-type">${itemType}</td>
                  <td class="col-qty">${qty}</td>
                  <td class="col-price">$${unitPrice.toFixed(2)}</td>
                  <td class="col-total">$${amount.toFixed(2)}</td>
                </tr>
              `;
              }).join('');
            })()}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-row"><span>Subtotal:</span> <span>$${targetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div class="totals-row"><span>Adjustments:</span> <span>$0.00</span></div>
          <div class="totals-row totals-final"><span>Final Decision:</span> <span>$${targetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>

        <div class="ledger-footnote">
          ${documentType === 'invoice' 
            ? 'This invoice reflects recorded pricing decisions at the time they were made.<br>It does not interpret outcomes or adjust for negotiation.'
            : 'This quote reflects recorded pricing decisions at the time they were drafted.<br>It may change prior to finalization.'}
        </div>

        ${showPaymentSchedule && this.settings?.deposit_enabled !== false && this.calc.depositDue > 0 ? `
        <div class="payment-section">
          <div class="payment-row"><span class="payment-label">Payment Method:</span> <span class="payment-value">[ACH] [Card]</span></div>
          <div class="payment-row"><span class="payment-label">Due Date:</span> <span class="payment-value">${currentDate}</span></div>
          <div class="payment-row"><span class="payment-label">Reference:</span> <span class="payment-value">Invoice ID required</span></div>
        </div>
        ` : ''}


        ${!this.isUnlocked ? `
        <div class="watermark">
          <p>Created with <strong>HelpMeFilm.com</strong></p>
          <p class="watermark-upgrade">Upgrade to Pro to remove this watermark</p>
        </div>
        ` : ''}

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
  }

  // Ledger doctrine styles - contractual, minimal, no design flourishes
  _getEnhancedStyles() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', 'Source Sans Pro', -apple-system, system-ui, sans-serif;
        background: #F6F6F6;
        color: #1A1A1A;
        margin: 0;
        padding: 40px;
        line-height: 1.5;
      }
      
      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
        padding-bottom: 16px;
        border-bottom: 1px solid #1A1A1A;
      }

      .header-left {
        flex: 1;
      }

      .ledger-title {
        font-size: 16px;
        font-weight: 400;
        color: #1A1A1A;
        margin-bottom: 4px;
      }

      .ledger-subtitle {
        font-size: 14px;
        font-weight: 400;
        color: #1A1A1A;
      }

      .header-right {
        text-align: right;
      }

      .meta-row {
        font-size: 13px;
        color: #1A1A1A;
        line-height: 1.8;
        margin-bottom: 2px;
      }

      .meta-label {
        font-weight: 400;
      }

      .meta-value {
        font-weight: 400;
      }

      .context-block {
        background: #FFFFFF;
        padding: 16px;
        margin-bottom: 32px;
        border: 1px solid #D0D0D0;
      }

      .context-row {
        font-size: 13px;
        color: #1A1A1A;
        line-height: 1.8;
        margin-bottom: 4px;
      }

      .context-label {
        font-weight: 400;
        display: inline-block;
        width: 160px;
      }

      .context-value {
        font-weight: 400;
      }


      .ledger-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        background: #FFFFFF;
        border: 1px solid #D0D0D0;
      }

      .ledger-table thead {
        background: #FFFFFF;
        border-bottom: 2px solid #1A1A1A;
      }

      .ledger-table th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 13px;
        color: #1A1A1A;
      }

      .col-items { width: auto; }
      .col-type { width: 120px; }
      .col-qty { width: 100px; text-align: center !important; }
      .col-price { width: 130px; text-align: right !important; }
      .col-total { width: 150px; text-align: right !important; }

      .ledger-table tbody tr {
        border-bottom: 1px solid #E0E0E0;
      }

      .ledger-table tbody tr:hover {
        background: none;
      }

      .ledger-table td {
        padding: 12px 16px;
        font-size: 13px;
        color: #1A1A1A;
        vertical-align: top;
        font-weight: 400;
      }

      .totals-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin: 32px 0;
        padding: 16px;
        background: #FFFFFF;
        border: 1px solid #D0D0D0;
      }

      .totals-row {
        display: flex;
        justify-content: space-between;
        width: 350px;
        max-width: 100%;
        padding: 8px 0;
        font-size: 13px;
        color: #1A1A1A;
        font-weight: 400;
      }

      .totals-final {
        font-size: 14px;
        font-weight: 600;
        padding-top: 12px;
        margin-top: 8px;
        border-top: 1px solid #1A1A1A;
      }

      .ledger-footnote {
        margin: 32px 0;
        padding: 16px;
        background: #FFFFFF;
        border: 1px solid #D0D0D0;
        font-size: 12px;
        color: #1A1A1A;
        line-height: 1.6;
        font-weight: 400;
      }

      .payment-section {
        background: #FFFFFF;
        padding: 16px;
        margin: 24px 0;
        border: 1px solid #D0D0D0;
      }

      .payment-row {
        font-size: 13px;
        color: #1A1A1A;
        line-height: 1.8;
        margin-bottom: 4px;
      }

      .payment-label {
        font-weight: 400;
        display: inline-block;
        width: 140px;
      }

      .payment-value {
        font-weight: 400;
      }

      .watermark {
        text-align: center;
        padding: 24px;
        margin-top: 40px;
        border-top: 1px solid #D0D0D0;
        background: #FFFFFF;
      }

      .watermark p {
        margin: 0;
        color: #1A1A1A;
        font-size: 12px;
        font-weight: 400;
      }

      .watermark strong {
        font-weight: 600;
      }

      .watermark-upgrade {
        margin-top: 8px !important;
        font-size: 11px !important;
      }

      @media print {
        body {
          padding: 20px;
          background: white;
        }
        
        .invoice-header,
        .context-block,
        .ledger-table,
        .totals-section,
        .ledger-footnote,
        .payment-section {
          page-break-inside: avoid;
        }
        
        .watermark {
          display: block !important;
        }
      }
    `;
  }
}
