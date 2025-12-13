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

  // Generate enhanced HTML (Quote or Invoice)
  generateHTML(documentType = 'quote') {
    const shootDatesText = this.formatShootDates();
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const docNumber = documentType === 'invoice' 
      ? `INV-${Date.now().toString().slice(-8)}`
      : `QUO-${Date.now().toString().slice(-8)}`;
    
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

    const tableSum = combinedLineItems
      .filter(i => !i?.isSection)
      .reduce((s, i) => s + (Number(i?.amount || 0)), 0);
    const targetTotal = Number(this.calc?.total || 0);
    const diff = targetTotal - tableSum;

    const displayLineItems = (() => {
      if (!Number.isFinite(diff) || Math.abs(diff) < 0.01) return combinedLineItems;
      const next = [...combinedLineItems];
      next.push({ description: 'Custom Price Adjustment', amount: diff, quantity: 1, unitPrice: diff });
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
            ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="company-logo" />` : `<div class="company-name-header">${companyName}</div>`}
          </div>
          <div class="header-right">
            <div class="invoice-title">${documentType.toUpperCase()}</div>
            <div class="invoice-meta">
              <div><strong>${documentType === 'invoice' ? 'Invoice' : 'Quote'} #:</strong> ${docNumber}</div>
              <div><strong>Date:</strong> ${currentDate}</div>
            </div>
          </div>
        </div>

        <div class="parties-grid">
          <div class="party-box">
            <div class="party-label">TO</div>
            <div class="party-name">${this.formData.client_name || 'Client Name'}</div>
            ${this.formData.client_email ? `<div class="party-detail">${this.formData.client_email}</div>` : ''}
            ${this.formData.client_phone ? `<div class="party-detail">${this.formData.client_phone}</div>` : ''}
          </div>
          <div class="party-box">
            <div class="party-label">FROM</div>
            <div class="party-name">${companyName}</div>
            ${companyEmail ? `<div class="party-detail">${companyEmail}</div>` : ''}
            ${companyPhone ? `<div class="party-detail">${companyPhone}</div>` : ''}
            ${companyAddress ? `<div class="party-detail">${companyAddress}</div>` : ''}
            ${companyWebsite ? `<div class="party-detail">${companyWebsite}</div>` : ''}
          </div>
        </div>

        ${this.formData.project_title || shootDatesText !== 'TBD' || this.formData.project_manager ? `
        <div class="project-details">
          <div class="project-header">PROJECT DETAILS</div>
          <div class="project-content">
            ${this.formData.project_title ? `<div class="project-row"><span class="project-label">Project:</span><span class="project-value">${this.formData.project_title}</span></div>` : ''}
            ${shootDatesText !== 'TBD' ? `<div class="project-row"><span class="project-label">Shoot Dates:</span><span class="project-value">${shootDatesText}</span></div>` : ''}
            ${this.formData.project_manager ? `<div class="project-row"><span class="project-label">Project Manager:</span><span class="project-value">${this.formData.project_manager}</span></div>` : ''}
            ${this.formData.production_company ? `<div class="project-row"><span class="project-label">Production Company:</span><span class="project-value">${this.formData.production_company}</span></div>` : ''}
          </div>
        </div>
        ` : ''}

        <table class="invoice-table">
          <thead>
            <tr>
              <th class="col-no">#</th>
              <th class="col-items">Description</th>
              <th class="col-qty">Qty</th>
              <th class="col-price">Rate</th>
              <th class="col-total">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              let lineNumber = 0;
              return (displayLineItems || []).map((item, index) => {
                if (item?.isSection) {
                  return `
                  <tr ${index % 2 === 0 ? 'class="row-alt"' : ''}>
                    <td class="col-no"></td>
                    <td class="col-items" colspan="4">
                      <div class="item-main" style="text-transform: uppercase; letter-spacing: 1px; color: #2563eb;">${item.description}</div>
                    </td>
                  </tr>
                `;
                }

                lineNumber += 1;
                const parts = (item.description || '').split(' - ');
                const mainDesc = parts[0];
                const subDesc = parts.slice(1).join(' - ');
                const amount = Number(item.amount || 0);
                const qty = typeof item?.quantity === 'number' ? item.quantity : 1;
                const unitPrice = typeof item?.unitPrice === 'number'
                  ? item.unitPrice
                  : (qty > 0 ? (amount / qty) : amount);
                return `
                <tr ${index % 2 === 0 ? 'class="row-alt"' : ''}>
                  <td class="col-no">${lineNumber}</td>
                  <td class="col-items">
                    <div class="item-main">${mainDesc}</div>
                    ${subDesc ? `<div class="item-sub">${subDesc}</div>` : ''}
                  </td>
                  <td class="col-qty">${qty}</td>
                  <td class="col-price">$${unitPrice.toFixed(2)}</td>
                  <td class="col-total">$${amount.toFixed(2)}</td>
                </tr>
              `;
              }).join('');
            })()}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="4" class="total-label">Total:</td>
              <td class="total-amount">$${this.calc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>

        <div class="bottom-section">
          ${showPaymentSchedule && this.settings?.deposit_enabled !== false && this.calc.depositDue > 0 ? `
          <div class="payment-info">
            <div class="payment-title">Payment information:</div>
            ${companyName ? `<div class="payment-detail"><strong>Bank Name:</strong> ${companyName}</div>` : ''}
            ${companyEmail ? `<div class="payment-detail"><strong>Account:</strong> ${companyEmail}</div>` : ''}
            <div class="payment-schedule">
              <div class="payment-item">
                <span>Deposit Due (${this.settings?.deposit_percent || 50}%)</span>
                <span>$${this.calc.depositDue.toFixed(2)}</span>
              </div>
              <div class="payment-item">
                <span>Balance Due</span>
                <span>$${this.calc.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
          ` : ''}

          ${termsAndConditions ? `
          <div class="terms-section">
            <div class="terms-title">Terms & conditions</div>
            <div class="terms-text">${termsAndConditions.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
        </div>

        ${notesToCustomer ? `
        <div class="notes-section">
          <strong>Note:</strong> ${notesToCustomer.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        ${showSignature ? `
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-title">CLIENT SIGNATURE</div>
            <div class="signature-line"></div>
            <div class="signature-label">Signature</div>
            <div class="signature-date">Date: _________________</div>
          </div>
          <div class="signature-box">
            <div class="signature-title">AUTHORIZED BY</div>
            <div class="signature-line"></div>
            <div class="signature-label">${companyName}</div>
            <div class="signature-date">Date: _________________</div>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="footer-logo" />` : `<div class="footer-company">${companyName}</div>`}
          <div class="footer-contact">
            ${companyPhone ? `<span>📞 ${companyPhone}</span>` : ''}
            ${companyEmail ? `<span>✉ ${companyEmail}</span>` : ''}
            ${companyWebsite ? `<span>🌐 ${companyWebsite}</span>` : ''}
            ${companyAddress ? `<span>📍 ${companyAddress}</span>` : ''}
          </div>
        </div>

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

  // StudioBinder-inspired professional styles
  _getEnhancedStyles() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        background: #ffffff;
        color: #1f2937;
        padding: 48px;
        max-width: 900px;
        margin: 0 auto;
        line-height: 1.6;
      }

      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 48px;
        padding-bottom: 24px;
        border-bottom: 2px solid #2563eb;
      }

      .header-left {
        flex: 1;
      }

      .company-logo {
        max-width: 200px;
        max-height: 80px;
        object-fit: contain;
      }

      .company-name-header {
        font-size: 28px;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.5px;
      }

      .header-right {
        text-align: right;
      }

      .invoice-title {
        font-size: 36px;
        font-weight: 700;
        color: #2563eb;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }

      .invoice-meta {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.8;
      }

      .invoice-meta strong {
        color: #374151;
        font-weight: 600;
      }

      .parties-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 40px;
      }

      .party-box {
        background: #f9fafb;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }

      .party-label {
        font-size: 11px;
        color: #2563eb;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
      }

      .party-name {
        font-size: 18px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 8px;
      }

      .party-detail {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.8;
      }

      .project-details {
        background: #eff6ff;
        padding: 20px 24px;
        border-radius: 12px;
        margin-bottom: 40px;
        border: 1px solid #bfdbfe;
      }

      .project-header {
        font-size: 11px;
        color: #2563eb;
        font-weight: 700;
        letter-spacing: 1px;
        margin-bottom: 16px;
      }

      .project-content {
        display: grid;
        gap: 8px;
      }

      .project-row {
        display: flex;
        font-size: 14px;
        line-height: 1.6;
      }

      .project-label {
        color: #6b7280;
        font-weight: 500;
        min-width: 160px;
      }

      .project-value {
        color: #111827;
        font-weight: 600;
      }

      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 40px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
      }

      .invoice-table thead {
        background: #2563eb;
        color: #ffffff;
      }

      .invoice-table th {
        padding: 16px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      .col-no { width: 50px; text-align: center !important; }
      .col-items { width: auto; }
      .col-qty { width: 80px; text-align: center !important; }
      .col-price { width: 130px; text-align: right !important; }
      .col-total { width: 130px; text-align: right !important; }

      .invoice-table tbody tr {
        border-bottom: 1px solid #e5e7eb;
        transition: background-color 0.2s;
      }

      .invoice-table tbody tr.row-alt {
        background: #f9fafb;
      }

      .invoice-table tbody tr:hover {
        background: #f3f4f6;
      }

      .invoice-table td {
        padding: 16px 16px;
        font-size: 14px;
        color: #111827;
        vertical-align: top;
      }

      .item-main {
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }

      .item-sub {
        font-size: 12px;
        color: #6b7280;
        line-height: 1.5;
      }

      .invoice-table td:nth-child(3),
      .invoice-table td:nth-child(4),
      .invoice-table td:nth-child(5) {
        text-align: right;
      }

      .invoice-table tfoot {
        background: #f9fafb;
        border-top: 3px solid #2563eb;
      }

      .total-row td {
        padding: 24px 16px !important;
        font-size: 20px;
        font-weight: 700;
      }

      .total-label {
        color: #111827;
        text-align: right !important;
      }

      .total-amount {
        color: #000000;
        font-size: 24px !important;
      }

      .bottom-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 40px;
      }

      .payment-info {
        background: #f9fafb;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }

      .payment-title {
        font-size: 11px;
        font-weight: 700;
        color: #2563eb;
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .payment-detail {
        color: #6b7280;
        margin-bottom: 8px;
        font-size: 13px;
      }

      .payment-detail strong {
        color: #111827;
        font-weight: 600;
      }

      .payment-schedule {
        margin-top: 16px;
        background: #ffffff;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .payment-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        font-weight: 600;
        color: #111827;
        font-size: 14px;
        border-bottom: 1px solid #f3f4f6;
      }

      .payment-item:last-child {
        border-bottom: none;
      }

      .terms-section {
        background: #f9fafb;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }

      .terms-title {
        font-size: 11px;
        font-weight: 700;
        color: #2563eb;
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .terms-text {
        color: #6b7280;
        line-height: 1.8;
        font-size: 12px;
      }

      .notes-section {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 20px 24px;
        margin-bottom: 40px;
        font-size: 13px;
        color: #78350f;
        line-height: 1.8;
        border-radius: 8px;
      }

      .notes-section strong {
        color: #92400e;
        font-weight: 700;
      }

      .signature-section {
        background: #f9fafb;
        padding: 32px 24px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin: 50px 0 40px 0;
      }

      .signature-box {
        text-align: left;
      }

      .signature-title {
        font-size: 11px;
        font-weight: 700;
        color: #2563eb;
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .signature-line {
        border-bottom: 2px solid #2563eb;
        height: 70px;
        margin-bottom: 12px;
        background: #ffffff;
        border-radius: 4px;
      }

      .signature-label {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .signature-date {
        margin-top: 12px;
        font-size: 12px;
        color: #6b7280;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 32px;
        border-top: 2px solid #e5e7eb;
        margin-top: 48px;
      }

      .footer-logo {
        max-width: 150px;
        max-height: 60px;
        object-fit: contain;
      }

      .footer-company {
        font-size: 16px;
        font-weight: 700;
        color: #111827;
      }

      .footer-contact {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 11px;
        color: #6b7280;
        align-items: center;
      }

      .footer-contact span {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .footer-contact span::before {
        content: '•';
        margin-right: 8px;
        color: #d1d5db;
      }

      .footer-contact span:first-child::before {
        display: none;
      }

      .watermark {
        text-align: center;
        padding: 32px 24px;
        margin-top: 48px;
        border-top: 2px solid #e5e7eb;
        background: #f9fafb;
        border-radius: 8px;
      }

      .watermark p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }

      .watermark strong {
        color: #2563eb;
        font-weight: 700;
      }

      .watermark-upgrade {
        margin-top: 8px !important;
        font-size: 12px !important;
        color: #9ca3af !important;
      }

      @media print {
        body {
          padding: 20px;
          background: white;
        }
        
        .invoice-header,
        .parties-grid,
        .bottom-section,
        .signature-section,
        .footer {
          page-break-inside: avoid;
        }
      }

      @media (max-width: 768px) {
        .parties-grid,
        .bottom-section,
        .signature-section {
          grid-template-columns: 1fr;
        }

        .invoice-title {
          font-size: 32px;
        }

        .footer {
          flex-direction: column;
          gap: 20px;
          text-align: center;
        }

        .footer-contact {
          justify-content: center;
        }
      }
    `;
  }
}
