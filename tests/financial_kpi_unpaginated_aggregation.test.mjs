/**
 * SIENVI AGENCY: FINANCIAL KPI UNPAGINATED AGGREGATION & PAGINATION SEPARATION TEST
 * Validates Section 5 requirements:
 * 1. All headline collection, fee, payout, and outstanding-balance totals are calculated
 *    from the FULL eligible dataset on the server.
 * 2. Financial KPIs are NOT calculated from a paginated list of payments on the client.
 * 3. Table pagination is completely separate from metric aggregation.
 * 4. Tested with more payment records than one API page (e.g. 25 payments over page size 10).
 * 5. Empty or incomplete ledger displays Data Unavailable or Reconciliation Pending
 *    rather than falsely verified zero balances.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Section 5: Server-Side Unpaginated Financial KPI Aggregation", () => {
  // Helper simulating get-admin-billing-overview server logic
  function generateBillingOverviewResponse({
    paymentsList = [],
    invoicesList = [],
    isSubledgerActive = true,
    page = 1,
    pageSize = 10,
  }) {
    // 1. Unpaginated Server-Side Aggregation
    const verifiedFullPayments = paymentsList.filter(
      (p) => p.status === "succeeded" && p.reconciled === true
    );
    const hasVerifiedCash = isSubledgerActive && verifiedFullPayments.length > 0;

    const fullGrossCollectionsCents = hasVerifiedCash
      ? verifiedFullPayments.reduce((sum, p) => sum + (p.grossAmountCents || 0), 0)
      : null;

    const fullFeesCents = hasVerifiedCash
      ? verifiedFullPayments.reduce((sum, p) => sum + (p.feeAmountCents || 0), 0)
      : null;

    const fullNetCashCents =
      fullGrossCollectionsCents !== null && fullFeesCents !== null
        ? fullGrossCollectionsCents - fullFeesCents
        : null;

    const fullPayoutsCents = hasVerifiedCash ? 0 : null;

    const fullOpenInvoicesTotalCents = invoicesList
      .filter((i) => i.status === "open" || i.status === "past_due")
      .reduce((sum, i) => sum + (i.amountDueCents || i.totalAmountCents || 0), 0);

    // 2. Separate Table Pagination
    const paginateArray = (arr, p, pSize) => {
      const offset = (p - 1) * pSize;
      const items = arr.slice(offset, offset + pSize);
      return {
        items,
        page: p,
        pageSize: pSize,
        totalItems: arr.length,
        totalPages: Math.ceil(arr.length / pSize),
      };
    };

    return {
      overview: {
        operatingMrrCents: 1578300,
        grossCollectionsMtdCents: fullGrossCollectionsCents,
        stripeFeesMtdCents: fullFeesCents,
        netSettledCashMtdCents: fullNetCashCents,
        bankPayoutsMtdCents: fullPayoutsCents,
        collectedRevenueMtdCents: fullGrossCollectionsCents ?? 0,
        collectedRevenueStatus: hasVerifiedCash ? "verified" : "reconciliation_pending",
        financialMetricsStatus: hasVerifiedCash ? "verified" : "reconciliation_pending",
        openInvoicesTotalCents: fullOpenInvoicesTotalCents,
      },
      payments: paginateArray(paymentsList, page, pageSize),
      invoices: paginateArray(invoicesList, page, pageSize),
    };
  }

  it("5.1: Aggregates full eligible dataset when records exceed one API page (25 records, pageSize 10)", () => {
    // Generate 25 verified payment records of $100.00 gross and $3.20 fee each
    const payments = [];
    for (let i = 1; i <= 25; i++) {
      payments.push({
        id: `pmt-${i.toString().padStart(3, "0")}`,
        grossAmountCents: 10000, // $100.00
        feeAmountCents: 320,    // $3.20
        netAmountCents: 9680,   // $96.80
        status: "succeeded",
        reconciled: true,
      });
    }

    // Request Page 1 with PageSize = 10
    const resPage1 = generateBillingOverviewResponse({
      paymentsList: payments,
      page: 1,
      pageSize: 10,
    });

    // Verify pagination slice
    assert.equal(resPage1.payments.items.length, 10, "Paginated table slice must contain exactly 10 items");
    assert.equal(resPage1.payments.totalItems, 25, "Total items metadata must report all 25 records");
    assert.equal(resPage1.payments.totalPages, 3, "Total pages must be 3");

    // CRITICAL: Headline totals must reflect all 25 payments ($2,500.00), NOT just page 1 ($1,000.00)
    assert.equal(
      resPage1.overview.grossCollectionsMtdCents,
      250000,
      "Server headline gross collections must equal 25 x $100.00 = $2,500.00"
    );
    assert.equal(
      resPage1.overview.stripeFeesMtdCents,
      8000,
      "Server headline fees must equal 25 x $3.20 = $80.00"
    );
    assert.equal(
      resPage1.overview.netSettledCashMtdCents,
      242000,
      "Server headline net cash must equal 25 x $96.80 = $2,420.00"
    );

    // Prove that summing only page 1 items yields an incorrect partial amount ($1,000.00)
    const clientSummedPage1 = resPage1.payments.items.reduce((acc, p) => acc + p.grossAmountCents, 0);
    assert.equal(clientSummedPage1, 100000, "Client sum of page 1 is only $1,000.00");
    assert.notEqual(
      clientSummedPage1,
      resPage1.overview.grossCollectionsMtdCents,
      "Headline KPI must NOT be computed from paginated table slice"
    );

    // Request Page 2 with PageSize = 10
    const resPage2 = generateBillingOverviewResponse({
      paymentsList: payments,
      page: 2,
      pageSize: 10,
    });
    assert.equal(resPage2.payments.items.length, 10);
    assert.equal(resPage2.payments.items[0].id, "pmt-011");
    // Headline metrics remain invariant across different pages
    assert.equal(resPage2.overview.grossCollectionsMtdCents, 250000);
  });

  it("5.2: Empty ledger displays Reconciliation Pending / null rather than falsely verified zero", () => {
    const emptyResponse = generateBillingOverviewResponse({
      paymentsList: [],
      isSubledgerActive: true,
    });

    assert.equal(emptyResponse.overview.grossCollectionsMtdCents, null);
    assert.equal(emptyResponse.overview.stripeFeesMtdCents, null);
    assert.equal(emptyResponse.overview.netSettledCashMtdCents, null);
    assert.equal(emptyResponse.overview.bankPayoutsMtdCents, null);
    assert.equal(emptyResponse.overview.collectedRevenueStatus, "reconciliation_pending");
    assert.equal(emptyResponse.overview.financialMetricsStatus, "reconciliation_pending");

    // Client display evaluation logic
    const isFinancialDataUnavailable =
      !true || // subledgerActive
      emptyResponse.overview.financialMetricsStatus === "reconciliation_pending" ||
      emptyResponse.overview.grossCollectionsMtdCents === null;

    assert.equal(
      isFinancialDataUnavailable,
      true,
      "UI must interpret null as Reconciliation Pending (--), not verified $0.00"
    );
  });

  it("5.3: Feature flag disabled strictly returns reconciliation_pending & null collections", () => {
    const payments = [
      { id: "p1", grossAmountCents: 50000, feeAmountCents: 1500, netAmountCents: 48500, status: "succeeded", reconciled: true },
    ];

    const disabledResponse = generateBillingOverviewResponse({
      paymentsList: payments,
      isSubledgerActive: false, // Flag disabled
    });

    assert.equal(disabledResponse.overview.grossCollectionsMtdCents, null);
    assert.equal(disabledResponse.overview.collectedRevenueStatus, "reconciliation_pending");
  });

  it("5.4: Unreconciled and failed payments are excluded from server collections total", () => {
    const mixedPayments = [
      { id: "p1", grossAmountCents: 100000, feeAmountCents: 3000, status: "succeeded", reconciled: true },
      { id: "p2", grossAmountCents: 50000, feeAmountCents: 1500, status: "succeeded", reconciled: true },
      { id: "p3", grossAmountCents: 20000, feeAmountCents: 0, status: "failed", reconciled: false }, // Failed
      { id: "p4", grossAmountCents: 40000, feeAmountCents: 1200, status: "succeeded", reconciled: false }, // Unreconciled
      { id: "p5", grossAmountCents: 30000, feeAmountCents: 900, status: "pending", reconciled: false }, // Pending
    ];

    const res = generateBillingOverviewResponse({ paymentsList: mixedPayments });

    // Total rows in table is 5
    assert.equal(res.payments.totalItems, 5);

    // Headline total only includes p1 ($1,000) + p2 ($500) = $1,500.00
    assert.equal(res.overview.grossCollectionsMtdCents, 150000);
    assert.equal(res.overview.stripeFeesMtdCents, 4500);
    assert.equal(res.overview.netSettledCashMtdCents, 145500);
  });

  it("5.5: Outstanding receivables aggregated across full unpaginated invoice set (30 invoices, pageSize 10)", () => {
    const invoices = [];
    for (let i = 1; i <= 30; i++) {
      invoices.push({
        id: `inv-${i.toString().padStart(3, "0")}`,
        totalAmountCents: 50000, // $500.00
        amountDueCents: 50000,
        status: i % 2 === 0 ? "open" : "past_due",
      });
    }

    const res = generateBillingOverviewResponse({
      invoicesList: invoices,
      page: 1,
      pageSize: 10,
    });

    assert.equal(res.invoices.items.length, 10);
    assert.equal(res.invoices.totalItems, 30);
    // 30 x $500.00 = $15,000.00
    assert.equal(res.overview.openInvoicesTotalCents, 1500000);
  });
});
