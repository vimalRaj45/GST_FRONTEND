// guideScenarios.js — All 6 guided learning scenarios with step-by-step validators
import { getBusinessInvoices, getPeriods } from '../api/client.js';

// ─────────────────────────────────────────────────────────────────────────────
// Validator helpers
// ─────────────────────────────────────────────────────────────────────────────
const getInvoices = async (business) => {
  if (!business) return [];
  try { return await getBusinessInvoices(business.id); }
  catch { return []; }
};

const getPeriodsData = async (business) => {
  if (!business) return [];
  try { return await getPeriods(business.id); }
  catch { return []; }
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIOS
// ─────────────────────────────────────────────────────────────────────────────
export const GUIDE_SCENARIOS = [

  // ── Scenario 1: Intra-State ────────────────────────────────────────
  {
    id: 'intrastate',
    title: 'Intra-State Sale — CGST + SGST',
    difficulty: 'Beginner',
    difficultyColor: 'success',
    description: 'Learn to create a B2B invoice where seller and buyer are in the same state and see CGST + SGST applied automatically.',
    steps: [
      {
        label: 'Select a Business Scenario',
        page: '/register-business',
        pageLabel: 'Business Selection',
        instruction:
          'Choose and claim any Regular Scheme business scenario card registered in Maharashtra (State Code 27) from the list. ' +
          'This will be your seller identity for this scenario.',
        aiHint:
          'Every GSTIN starts with a 2-digit state code. "27" means Maharashtra. ' +
          'For an intra-state sale, both seller and buyer must be in the SAME state — so tax splits into CGST + SGST.',
        checkLabel: 'I claimed my business',
        validate: async ({ business }) => {
          if (!business)
            return { pass: false, msg: 'No business selected yet. Click "Claim This Business" on any scenario card on this page.' };
          return { pass: true, msg: `Perfect! You selected "${business.name}" in ${business.state} (Code: ${business.state_code}).` };
        },
      },
      {
        label: 'Create an Intra-State Invoice',
        page: '/invoices/sell',
        pageLabel: 'Sell Invoice',
        instruction:
          'In the Invoice Header: set Buyer to any customer located in the same state as you (e.g. Maharashtra Suppliers Ltd). ' +
          'In Line Items: add any item at ₹10,000 price with 18% GST. ' +
          'Click "Review" and then "Submit Invoice".',
        aiHint:
          'Watch the chips under the item — you will see CGST: ₹900 and SGST: ₹900 (each 9%). ' +
          'That is because 18% splits equally: 9% goes to Centre (CGST) and 9% goes to your state (SGST).',
        checkLabel: 'I submitted an intra-state invoice',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'Go back to Step 1 and select a business first.' };
          const invoices = await getInvoices(business);
          const intra = invoices.filter(i => !i.is_interstate);
          if (intra.length === 0)
            return {
              pass: false,
              msg: 'No intra-state invoice found. Make sure you select a buyer in the SAME state as you, then click Submit Invoice.',
            };
          const latest = intra[intra.length - 1];
          const item = latest?.items?.[0];
          return {
            pass: true,
            msg: `Found your intra-state invoice (${latest.invoice_number})! ` +
              (item ? `CGST: ₹${item.cgst?.toFixed(0)}, SGST: ₹${item.sgst?.toFixed(0)}` : '') +
              '. Both went to your state!'
          };
        },
      },
      {
        label: 'Verify CGST + SGST in ITC Ledger',
        page: '/ledger',
        pageLabel: 'ITC Ledger',
        instruction:
          'Go to the ITC Ledger. Find the "Output" entry from your invoice. ' +
          'Confirm you can see separate CGST Amount and SGST Amount columns — not IGST.',
        aiHint:
          '"Output" entries = tax collected from customers. ' +
          'The CGST portion goes to the Central Government and SGST to your State Government. ' +
          'Your net tax payable = Total Output − Eligible Input Tax Credits.',
        checkLabel: 'I verified the CGST+SGST entry in the ledger',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected. Go to Step 1.' };
          const invoices = await getInvoices(business);
          const intra = invoices.filter(i => !i.is_interstate);
          if (intra.length === 0)
            return { pass: false, msg: 'No intra-state invoice exists yet. Complete Step 2 first.' };
          return {
            pass: true,
            msg: 'Excellent! You have confirmed the CGST + SGST split in your ledger. Scenario 1 complete!'
          };
        },
      },
    ],
  },

  // ── Scenario 2: Inter-State ────────────────────────────────────────
  {
    id: 'interstate',
    title: 'Inter-State Sale — IGST',
    difficulty: 'Beginner',
    difficultyColor: 'success',
    description: 'Bill a customer in a different state and see IGST applied as a single full-rate tax.',
    steps: [
      {
        label: 'Select a Business Scenario',
        page: '/register-business',
        pageLabel: 'Business Selection',
        instruction:
          'Choose and claim any Regular Scheme business scenario card registered in Delhi (State Code 07) from the list. ' +
          'Any buyer outside Delhi will trigger an inter-state sale.',
        aiHint:
          'Delhi GSTIN starts with 07. When seller and buyer are in DIFFERENT states, ' +
          'the Central Government collects IGST (full rate) and later shares it with the destination state.',
        checkLabel: 'I claimed my business',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected. Claim a business on this page.' };
          return { pass: true, msg: `You selected "${business.name}" in ${business.state}.` };
        },
      },
      {
        label: 'Create an Inter-State Invoice',
        page: '/invoices/sell',
        pageLabel: 'Sell Invoice',
        instruction:
          'Create a Tax Invoice. Select any customer in a different state from yours as the buyer (e.g. Karnataka Distributors Hub). ' +
          'Add any item (e.g. Smartphones) at ₹1,00,000 with 18% GST. Submit the invoice.',
        aiHint:
          'Notice the blue "Inter-State — IGST applies" banner in the header. ' +
          'The item chip shows only IGST: ₹18,000 (18% of ₹1,00,000). ' +
          'There is no CGST/SGST split — all ₹18,000 goes to the Central Government as IGST.',
        checkLabel: 'I submitted an inter-state invoice',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected. Go to Step 1.' };
          const invoices = await getInvoices(business);
          const inter = invoices.filter(i => i.is_interstate);
          if (inter.length === 0)
            return {
              pass: false,
              msg: 'No inter-state invoice found. Choose a buyer in a DIFFERENT state from yours and submit the invoice.'
            };
          const latest = inter[inter.length - 1];
          const item = latest?.items?.[0];
          return {
            pass: true,
            msg: `Found inter-state invoice (${latest.invoice_number})! ` +
              (item ? `IGST: ₹${item.igst?.toFixed(0)} applied. No CGST/SGST split.` : '')
          };
        },
      },
      {
        label: 'Cross-Check with the GST Calculator',
        page: '/calculator',
        pageLabel: 'GST Calculator',
        instruction:
          'In the Calculator, switch to "Inter-State" mode. Enter ₹1,00,000 at 18%. ' +
          'Confirm IGST = ₹18,000. Compare with the Intra-State mode to see the difference.',
        aiHint:
          'In Intra-State mode: ₹18,000 splits into CGST ₹9,000 + SGST ₹9,000. ' +
          'In Inter-State mode: full ₹18,000 stays as IGST. ' +
          'Same total amount — but who gets the money is completely different!',
        checkLabel: 'I verified IGST using the calculator',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const invoices = await getInvoices(business);
          if (!invoices.some(i => i.is_interstate))
            return { pass: false, msg: 'Complete Step 2 (create inter-state invoice) first.' };
          return {
            pass: true,
            msg: 'You have now understood IGST vs CGST+SGST. The key rule: same state = split, different state = IGST only!'
          };
        },
      },
    ],
  },

  // ── Scenario 3: Composition Scheme ──────────────────────────────────
  {
    id: 'composition',
    title: 'Composition Scheme Restrictions',
    difficulty: 'Intermediate',
    difficultyColor: 'warning',
    description: 'Experience the limits of a composition dealer: no Tax Invoice, no ITC, flat rate only.',
    steps: [
      {
        label: 'Claim a Composition Scheme Business',
        page: '/register-business',
        pageLabel: 'Business Selection',
        instruction:
          'Claim any business scenario card marked as Composition Scheme from the list (look for the "composition" tag on the card).',
        aiHint:
          'Composition businesses pay a flat rate (e.g. 1%) on total turnover. ' +
          'They are designed for small businesses with turnover under ₹1.5 Crore. ' +
          'The trade-off: they cannot collect GST from customers or claim any ITC on purchases.',
        checkLabel: 'I selected a composition business',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          if (business.scheme_type !== 'composition')
            return {
              pass: false,
              msg: `"${business.name}" is a Regular Scheme business. Please select a business scenario marked as Composition Scheme.`
            };
          return { pass: true, msg: `"${business.name}" is a Composition Scheme dealer! Notice how it differs from regular businesses.` };
        },
      },
      {
        label: 'Try Creating an Invoice',
        page: '/invoices/sell',
        pageLabel: 'Sell Invoice',
        instruction:
          'Open the New Invoice page. Read the yellow warning banner carefully. ' +
          'Try to change the "Invoice Type" — notice it is locked to "Bill of Supply". ' +
          'Try adding an item — notice no GST is collected from the buyer.',
        aiHint:
          'Composition dealers CANNOT issue Tax Invoices. They must use "Bill of Supply". ' +
          'This document shows ₹0 tax for the buyer — because the dealer pays the flat rate directly to the government, ' +
          'not the customer. Buyers CANNOT claim ITC from a Bill of Supply.',
        checkLabel: 'I observed the Bill of Supply restriction',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          if (business.scheme_type !== 'composition')
            return { pass: false, msg: 'You need a Composition Scheme business. Go back to Step 1.' };
          return {
            pass: true,
            msg: 'You noticed the restriction! Composition dealers are legally prohibited from issuing Tax Invoices under Section 10 of CGST Act.'
          };
        },
      },
      {
        label: 'Submit a Bill of Supply',
        page: '/invoices/sell',
        pageLabel: 'Sell Invoice',
        instruction:
          'Now submit a Bill of Supply. Add an item at ₹5,000. Notice the tax chips show ₹0 CGST, ₹0 SGST. ' +
          'Submit the invoice. Verify it appears as "Bill of Supply" in your ITC Ledger.',
        aiHint:
          'Your composition tax for this sale is 1% of ₹5,000 = ₹50, paid directly to the government quarterly via CMP-08 return. ' +
          'The buyer gets the product but no ITC. ' +
          'This is why composition scheme is usually for B2C (end-consumer) businesses, not B2B supply chains.',
        checkLabel: 'I submitted the Bill of Supply',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          if (business.scheme_type !== 'composition')
            return { pass: false, msg: 'You need a Composition Scheme business.' };
          const invoices = await getInvoices(business);
          const bos = invoices.filter(i => i.invoice_type === 'bill_of_supply');
          if (bos.length === 0)
            return { pass: false, msg: 'No Bill of Supply found. Submit an invoice on this page (it will auto-generate as Bill of Supply).' };
          return {
            pass: true,
            msg: `Bill of Supply submitted (${bos[bos.length - 1]?.invoice_number})! No GST collected. Composition scenario complete!`
          };
        },
      },
    ],
  },

  // ── Scenario 4: ITC Reconciliation ──────────────────────────────────
  {
    id: 'itc_recon',
    title: 'ITC Matching & Reconciliation',
    difficulty: 'Intermediate',
    difficultyColor: 'warning',
    description: 'Learn to identify Matched, Pending, and Blocked ITC credits and understand how they affect your tax payable.',
    steps: [
      {
        label: 'Select a Regular Scheme Business',
        page: '/register-business',
        pageLabel: 'Business Selection',
        instruction:
          'Claim any business scenario card marked as Regular Scheme. ' +
          'The simulator has pre-seeded purchase invoices from suppliers in your ITC ledger.',
        aiHint:
          'Input Tax Credit (ITC) is the credit of GST paid on business purchases, which can be used to reduce the GST payable on sales. ' +
          'Every purchase you make from a GST-registered supplier creates an Input credit in your ledger. ' +
          'You can use these credits to reduce the tax you owe on your sales.',
        checkLabel: 'I selected a regular scheme business',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          if (business.scheme_type === 'composition')
            return { pass: false, msg: `"${business.name}" is a Composition dealer. Please select a Regular Scheme business.` };
          return { pass: true, msg: `"${business.name}" (Regular Scheme) selected. Your ITC ledger has pre-seeded purchase entries!` };
        },
      },
      {
        label: 'Find the Matched, Pending & Blocked Entries',
        page: '/ledger',
        pageLabel: 'ITC Ledger',
        instruction:
          'Open the ITC Ledger. Identify 3 types of entries:\n' +
          '• Matched: Supplier filed GSTR-1 → you CAN claim this\n' +
          '• Pending: Supplier did NOT file yet → cannot claim yet\n' +
          '• Blocked: Section 17(5) (food, vehicles) → NEVER claimable\n' +
          'Find each type and check the amounts.',
        aiHint:
          'The pre-seeded data has 1 Matched and 1 Pending entry. ' +
          'When you close a tax period, the simulator auto-converts Pending → Matched ' +
          '(simulating the supplier filing their GSTR-1). ' +
          'Net Tax Payable = Output Tax − Only the Matched ITC.',
        checkLabel: 'I found and identified all ITC entry types',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          if (business.scheme_type === 'composition')
            return { pass: false, msg: 'Need a regular scheme business. Go to Step 1.' };
          return {
            pass: true,
            msg: 'You can see the Matched and Pending credits. Notice: you can ONLY deduct the Matched amount from your output tax right now.'
          };
        },
      },
      {
        label: 'Close the Period to Convert Pending → Matched',
        page: '/periods',
        pageLabel: 'Returns / Tax Periods',
        instruction:
          'Go to Returns. Click the open period. Then click "Close Period (File GSTR-1)". ' +
          'Now go back to the ITC Ledger and confirm the Pending entry turned Matched!',
        aiHint:
          'Closing the period simulates suppliers filing their GSTR-1. ' +
          'In real GST, when a supplier files GSTR-1 by the 11th, their invoices appear in YOUR GSTR-2B. ' +
          'That is when Pending credits become claimable Matched credits for you.',
        checkLabel: 'I closed the period and confirmed Pending → Matched',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const periods = await getPeriodsData(business);
          const closedOrFiled = periods.filter(p => p.status === 'closed' || p.status === 'filed');
          if (closedOrFiled.length === 0)
            return {
              pass: false,
              msg: 'No period has been closed yet. Go to Returns, open the active period, and click "Close Period".'
            };
          return {
            pass: true,
            msg: 'Period closed! All pending ITC from suppliers is now matched. Your full ITC is available to offset output tax.'
          };
        },
      },
    ],
  },

  // ── Scenario 5: Filing Returns ──────────────────────────────────────
  {
    id: 'filing',
    title: 'Filing GSTR-1 & GSTR-3B',
    difficulty: 'Advanced',
    difficultyColor: 'error',
    description: 'Complete the full monthly GST cycle: create invoices, close GSTR-1, review tax summary, and file GSTR-3B.',
    steps: [
      {
        label: 'Create at Least 2 Invoices',
        page: '/invoices/sell',
        pageLabel: 'Sell Invoice',
        instruction:
          'Create 2 invoices in the current open period using the Sell Invoice form:\n' +
          '1. One intra-state (same state buyer) at 18% GST\n' +
          '2. One inter-state (different state buyer) at 18% GST\n' +
          'This gives you output tax from both CGST+SGST and IGST transactions.',
        aiHint:
          'GSTR-1 requires invoice-level details of ALL your sales. ' +
          'Having both intra and inter-state invoices lets you practice reporting both B2B intra-state ' +
          'and B2B inter-state supply schedules in GSTR-1.',
        checkLabel: 'I created at least 2 invoices',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected. Select one from the Overview page.' };
          const invoices = await getInvoices(business);
          if (invoices.length < 2)
            return {
              pass: false,
              msg: `Only ${invoices.length} invoice(s) found. You need at least 2. Create another invoice.`
            };
          return { pass: true, msg: `Found ${invoices.length} invoices. You have enough sales data to file GSTR-1!` };
        },
      },
      {
        label: 'Close the Period — File GSTR-1',
        page: '/periods',
        pageLabel: 'Tax Periods',
        instruction:
          'Go to Returns. Select the active open period. ' +
          'Click "View GSTR-1 Summary" to review your invoice details. ' +
          'Then click "Close Period (Submit GSTR-1)" to lock and submit.',
        aiHint:
          'GSTR-1 is due by the 11th of the following month. ' +
          'When you file GSTR-1, all your invoices become visible to your buyers in their GSTR-2B — ' +
          'so THEY can claim ITC on purchases from you. Your filing directly helps your customers.',
        checkLabel: 'I submitted GSTR-1 for the period',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const periods = await getPeriodsData(business);
          const closed = periods.filter(p => p.status === 'closed' || p.status === 'filed');
          if (closed.length === 0)
            return { pass: false, msg: 'No period closed yet. Go to Returns and close the active period.' };
          return { pass: true, msg: `GSTR-1 submitted for ${closed[0].month}/${closed[0].year}! Invoice data now visible to buyers.` };
        },
      },
      {
        label: 'File GSTR-3B and Pay Net Tax',
        page: '/periods',
        pageLabel: 'Tax Periods',
        instruction:
          'Now click "File GSTR-3B" next to the closed period. ' +
          'Review the Filing Summary: Output Tax, Matched ITC, Net Tax Payable, and any interest/penalties. ' +
          'Click "Confirm & File GSTR-3B".',
        aiHint:
          'GSTR-3B due date is the 20th of each month. ' +
          'Net Tax = Output Tax (your sales tax) − Matched ITC (your purchase tax credits). ' +
          'Only the net amount is paid in cash — ITC reduces your real cash outflow!',
        checkLabel: 'I filed GSTR-3B successfully',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const periods = await getPeriodsData(business);
          const filed = periods.filter(p => p.status === 'filed');
          if (filed.length === 0)
            return { pass: false, msg: 'No period filed yet. After closing GSTR-1, click "File GSTR-3B" on the Returns page.' };
          const f = filed[0];
          return {
            pass: true,
            msg: `GSTR-3B filed for ${f.month}/${f.year}! Net Tax Paid: ₹${Number(f.net_payable || 0).toFixed(0)}. Filing cycle complete!`
          };
        },
      },
      {
        label: 'Check Your Achievement Progress',
        page: '/progress',
        pageLabel: 'Progress',
        instruction:
          'Go to the Progress tab. You should now see badges for:\n' +
          '• Created Invoice\n• Filed GSTR-1\n• Filed GSTR-3B\n' +
          'Check your overall completion percentage.',
        aiHint:
          'The monthly GST cycle repeats every month for every business: ' +
          'Create sales invoices → File GSTR-1 (by 11th) → File GSTR-3B + Pay (by 20th). ' +
          'Missing any deadline means penalties. Completing this cycle monthly is a core compliance requirement.',
        checkLabel: 'I reviewed my progress and achievements',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const periods = await getPeriodsData(business);
          const filed = periods.filter(p => p.status === 'filed');
          if (filed.length === 0) return { pass: false, msg: 'Complete Steps 2 and 3 first (file GSTR-1 and GSTR-3B).' };
          return { pass: true, msg: 'Full filing scenario complete! You have mastered the monthly GST compliance cycle.' };
        },
      },
    ],
  },

  // ── Scenario 6: Late Filing & Penalties ─────────────────────────────
  {
    id: 'penalties',
    title: 'Late Filing & Penalty Calculation',
    difficulty: 'Advanced',
    difficultyColor: 'error',
    description: 'Calculate the real cost of missing deadlines: 18% p.a. interest + ₹50/day late fee.',
    steps: [
      {
        label: 'Calculate Penalty in the GST Calculator',
        page: '/calculator',
        pageLabel: 'GST Calculator',
        instruction:
          'Use the GST Calculator to simulate a late filing scenario:\n' +
          '• Output Tax = ₹50,000\n' +
          '• ITC = ₹20,000\n' +
          '• Net Tax Payable = ₹30,000\n' +
          'Mentally calculate: 18% p.a. interest for 30 days of delay = ₹443. ' +
          'Late fee = 30 × ₹50 = ₹1,500.',
        aiHint:
          'Formula: Interest = Net Tax × 18% ÷ 365 × Days Overdue\n' +
          'For ₹30,000 net × 18% ÷ 365 × 30 days = ₹443 interest.\n' +
          'Late fee = Days × ₹50 per day (capped at ₹5,000).\n' +
          'Total extra cost = ₹1,943! Filing even 1 day early saves you money.',
        checkLabel: 'I understand the penalty formula',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'Select a business first (go to Overview).' };
          return {
            pass: true,
            msg: 'Good! Key formula memorized: Interest = Net Tax × 18% ÷ 365 × Days. Late Fee = Days × ₹50.'
          };
        },
      },
      {
        label: 'View a Late Period in Returns',
        page: '/periods',
        pageLabel: 'Tax Periods',
        instruction:
          'Go to the Returns page. If any period is past its deadline, open it. ' +
          'The Filing Review will show an "OVERDUE" badge with the exact interest and penalty pre-calculated for you.',
        aiHint:
          'GST interest runs from the day AFTER the deadline until the day you pay — including weekends and holidays. ' +
          'The simulator calculates this automatically. ' +
          'In real life, this causes businesses to owe more every single day they delay.',
        checkLabel: 'I viewed the penalty breakdown',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const periods = await getPeriodsData(business);
          if (periods.length === 0)
            return { pass: false, msg: 'No periods available. Select a business first and create some invoices.' };
          return {
            pass: true,
            msg: 'Quiz and scenarios completed! You have now reviewed the penalty system and mastered GST. All 6 scenarios complete — you are GST ready!'
          };
        },
      },
    ],
  },

  // ── Scenario 7: Sell & Purchase Invoice Forms ──────────────────────────
  {
    id: 'sell_purchase',
    title: 'Sell & Purchase Invoice — Outward & Inward Supply',
    difficulty: 'Beginner',
    difficultyColor: 'success',
    description:
      'Understand the difference between an outward supply (Sell Invoice) and an inward supply (Purchase Invoice), ' +
      'and how the toggle lets you switch between them. Learn how ITC from purchases offsets your sales tax liability.',
    steps: [
      {
        label: 'Open the Sell Invoice Form',
        page: '/invoices/sell',
        pageLabel: 'Sell Invoice',
        instruction:
          'Click "Invoices" in the navigation bar. The Sell Invoice form opens by default. ' +
          'Read the green banner: "You are the Seller". ' +
          'Notice the toggle at the top showing "↑ Sell Invoice | ↓ Purchase Invoice".',
        aiHint:
          'Outward Supply = goods/services you SELL. ' +
          'When you sell, you collect GST from your buyer (CGST+SGST for intra-state, IGST for inter-state). ' +
          'This collected tax is your OUTPUT TAX LIABILITY — you owe this to the government.',
        checkLabel: 'I opened the Sell Invoice form and read the banner',
        validate: async ({ business }) => {
          if (!business)
            return { pass: false, msg: 'No business selected. Select a Regular Scheme business first.' };
          return { pass: true, msg: `You are viewing the Sell Invoice form as "${business.name}". You are the Seller!` };
        },
      },
      {
        label: 'Create a Sell Invoice at 18% or 40%',
        page: '/invoices/sell',
        pageLabel: 'Sell Invoice',
        instruction:
          'Fill in the Sell Invoice:\n' +
          '• Select any buyer\n' +
          '• Add an item (e.g. "Office Chair") at ₹20,000\n' +
          '• Tax Rate: 18% (standard goods) or 40% (luxury/sin goods)\n' +
          'Submit the invoice and note the GST collected.',
        aiHint:
          'Updated GST Slabs: 0%, 5%, 18%, 40% (luxury and sin goods like tobacco). ' +
          '12% and 28% slabs have been removed. ' +
          'At 18%: ₹20,000 × 18% = ₹3,600 GST collected from buyer. ' +
          'At 40%: ₹20,000 × 40% = ₹8,000 GST collected — typical for tobacco or luxury items.',
        checkLabel: 'I created a sell invoice',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const invoices = await getInvoices(business);
          const sells = invoices.filter(i => i.seller_business_id === business.id);
          if (sells.length === 0)
            return { pass: false, msg: 'No sell invoice found yet. Fill out and submit the Sell Invoice form.' };
          return {
            pass: true,
            msg: `Sell invoice created (${sells[sells.length - 1]?.invoice_number})! GST has been added to your OUTPUT tax ledger.`
          };
        },
      },
      {
        label: 'Switch to Purchase Invoice using the Toggle',
        page: '/invoices/purchase',
        pageLabel: 'Purchase Invoice',
        instruction:
          'On the Sell Invoice page, click "↓ Purchase Invoice" in the toggle at the top. ' +
          'Read the blue banner: "You are the Buyer". ' +
          'Notice the ITC indicator — each item shows whether it is ITC Claimable or not.',
        aiHint:
          'Inward Supply = goods/services you BUY. ' +
          'Input Tax Credit (ITC) is the credit of GST paid on business purchases, ' +
          'which can be used to reduce the GST payable on sales. ' +
          'Exempt purchases have NO ITC. Regular purchases at any rate (5%, 18%, 40%) are fully ITC-eligible.',
        checkLabel: 'I switched to the Purchase Invoice form using the toggle',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          return {
            pass: true,
            msg: 'You are now on the Purchase Invoice form. Notice how the colour theme changed from green (sell) to blue (purchase)!'
          };
        },
      },
      {
        label: 'Record a Purchase and Claim ITC',
        page: '/invoices/purchase',
        pageLabel: 'Purchase Invoice',
        instruction:
          'Fill in the Purchase Invoice:\n' +
          '• Select a supplier from the dropdown\n' +
          '• Add an item (e.g. "Raw Material") at ₹10,000 with 18% GST\n' +
          '• See the "✓ ITC Claimable" badge on the item\n' +
          'Click "Record Purchase & Claim ITC".',
        aiHint:
          'ITC summary at review step: ₹10,000 × 18% = ₹1,800 ITC claimable. ' +
          'This ₹1,800 goes into your INPUT TAX CREDIT ledger. ' +
          'Net GST Payable = Output Tax (from sell) − ITC (from purchase). ' +
          'You only pay the DIFFERENCE to the government — that is the power of ITC!',
        checkLabel: 'I recorded a purchase and saw the ITC entry',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const invoices = await getInvoices(business);
          const purchases = invoices.filter(i => i.buyer_business_id === business.id);
          if (purchases.length === 0)
            return {
              pass: false,
              msg: 'No purchase recorded yet. Fill and submit the Purchase Invoice form on this page.'
            };
          return {
            pass: true,
            msg: `Purchase recorded (${purchases[purchases.length - 1]?.invoice_number})! ` +
              'ITC has been credited to your ledger. Check the ITC Ledger to see your claimable credit!'
          };
        },
      },
      {
        label: 'Verify ITC Offset in the ITC Ledger',
        page: '/ledger',
        pageLabel: 'ITC Ledger',
        instruction:
          'Go to the ITC Ledger. You should now see:\n' +
          '• An OUTPUT entry (from your sell invoice)\n' +
          '• An INPUT entry (from your purchase invoice)\n' +
          'The net tax payable = Output − Matched Input.',
        aiHint:
          'This is how GST avoids double taxation. ' +
          'Each business in the supply chain pays tax only on VALUE ADDED, not on the full price. ' +
          'Example: You bought ₹10,000 goods (paid ₹1,800 GST), sold for ₹20,000 (collected ₹3,600 GST). ' +
          'Net payable = ₹3,600 − ₹1,800 = ₹1,800 only. The ITC system ensures no cascading tax effect!',
        checkLabel: 'I verified ITC offset in the ledger',
        validate: async ({ business }) => {
          if (!business) return { pass: false, msg: 'No business selected.' };
          const invoices = await getInvoices(business);
          const hasSell = invoices.some(i => i.seller_business_id === business.id);
          const hasPurchase = invoices.some(i => i.buyer_business_id === business.id);
          if (!hasSell || !hasPurchase)
            return {
              pass: false,
              msg: 'You need both a Sell invoice and a Purchase invoice. Complete Steps 2 and 4 first.'
            };
          return {
            pass: true,
            msg: 'Scenario 7 complete! You have mastered Outward Supply (Sell), Inward Supply (Purchase), ITC claiming, and the net tax offset concept!'
          };
        },
      },
    ],
  },
];
