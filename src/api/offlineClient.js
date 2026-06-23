// offlineClient.js — High-fidelity client-side database & business rules fallback for Offline Mode.
// Replicates the database and server logic in local storage.

import { STATE_CODES, COMPOSITION_RATES } from '../../../backend/src/gstEngine.js';

// ============================================================
// HARDCODED SEED DATA
// ============================================================

export const OFFLINE_TAX_SLABS = [
  { id: 1, rate: 0, label: '0%', description: 'Zero Tax (Exempt) — Fresh vegetables, books, milk' },
  { id: 2, rate: 5, label: '5%', description: 'Low Tax (Essential Goods) — Packaged food, basic medicines' },
  { id: 3, rate: 12, label: '12%', description: 'Standard Tax (Common Items) — Mobile phones, clothing, computers' },
  { id: 4, rate: 18, label: '18%', description: 'Standard Tax (Most Goods & Services) — Electronics, IT services, restaurant bills' },
  { id: 5, rate: 28, label: '28%', description: 'High Tax (Luxury Goods) — ACs, luxury cars, cement' }
];

export const OFFLINE_HSN_CODES = [
  { id: 1, code: '0401', description: 'Fresh milk and cream — Exempt', tax_rate: 0 },
  { id: 2, code: '0901', description: 'Coffee & tea — Essential goods', tax_rate: 5 },
  { id: 3, code: '8517', description: 'Smartphones & mobile devices', tax_rate: 12 },
  { id: 4, code: '8471', description: 'Laptop & desktop computers', tax_rate: 18 },
  { id: 5, code: '9983', description: 'IT consulting & software development services', tax_rate: 18 },
  { id: 6, code: '8516', description: 'Air conditioners — Luxury', tax_rate: 28 }
];

export const OFFLINE_BUSINESS_TEMPLATES = [
  { id: 'offline-biz-1', name: 'SuperMart Retailers', gstin: '27AAACS9999A1Z1', state: 'Maharashtra', state_code: '27', scheme_type: 'regular', is_npc: false },
  { id: 'offline-biz-2', name: 'TechSolutions IT', gstin: '07AAACS7777C1Z3', state: 'Delhi', state_code: '07', scheme_type: 'regular', is_npc: false },
  { id: 'offline-biz-3', name: 'Sweet Delight Bakery', gstin: '29AAACS8888B1Z2', state: 'Karnataka', state_code: '29', scheme_type: 'composition', is_npc: false }
];

export const OFFLINE_NPC_BUSINESSES = [
  { id: 'npc-biz-1', name: 'Mumbai Wholesale Traders', gstin: '27AAACM1234A1Z5', state: 'Maharashtra', state_code: '27', scheme_type: 'regular', is_npc: true },
  { id: 'npc-biz-2', name: 'Bengaluru Tech Distributors', gstin: '29AAACK5678B1Z3', state: 'Karnataka', state_code: '29', scheme_type: 'regular', is_npc: true },
  { id: 'npc-biz-3', name: 'Delhi Logistics Services', gstin: '07AAACD9012C1Z1', state: 'Delhi', state_code: '07', scheme_type: 'regular', is_npc: true },
  { id: 'npc-biz-4', name: 'Chennai Retail Stores', gstin: '33AAACT3456D1Z8', state: 'Tamil Nadu', state_code: '33', scheme_type: 'regular', is_npc: true }
];

const OFFLINE_QUIZ_QUESTIONS = {
  'Input Tax Credit (ITC) rules and eligibility': [
    {
      question: 'Which of the following purchases is eligible for Input Tax Credit (ITC) for a software company?',
      options: [
        'Office laptops and server hardware',
        'Food and beverages for office parties',
        'Corporate cars purchased for directors\' personal use',
        'Memberships to local fitness clubs'
      ],
      correctIndex: 0,
      explanation: 'Under Section 17(5) of the CGST Act, certain items are blocked for ITC. Laptops and servers are capital assets used directly in the course of business, making them eligible. Food, personal vehicles, and gym memberships are block credits.'
    },
    {
      question: 'To claim Input Tax Credit (ITC), what is the key matching document requirement?',
      options: [
        'The tax invoice must be uploaded by the supplier in GSTR-1 and appear in the buyer\'s GSTR-2B/2A',
        'The buyer must print the receipt and mail it to the GST department',
        'The bank statement showing the payment is sufficient',
        'The supplier must issue a Bill of Supply'
      ],
      correctIndex: 0,
      explanation: 'Under GST rules, matching is essential. The supplier must file GSTR-1, which propagates the details to the buyer\'s GSTR-2B. This confirms that the tax was paid to the government before the buyer claims ITC.'
    }
  ],
  'CGST vs SGST vs IGST — when each applies': [
    {
      question: 'If a business registered in Maharashtra (Code 27) sells services to a client located in Delhi (Code 07), which tax applies?',
      options: [
        'IGST (Integrated GST)',
        'CGST + SGST (Central + State GST)',
        'UTGST (Union Territory GST)',
        'No tax is charged (0% GST)'
      ],
      correctIndex: 0,
      explanation: 'Inter-state supplies (between two different states or union territories) attract Integrated GST (IGST), which is collected by the Central Government and distributed according to destination rules.'
    },
    {
      question: 'For an intra-state sale (within the same state, e.g., Maharashtra to Maharashtra), how is the tax split?',
      options: [
        'Equally between CGST and SGST',
        '100% CGST to the Center',
        '100% SGST to the State',
        'It depends on the buyer\'s option'
      ],
      correctIndex: 0,
      explanation: 'Intra-state sales attract both CGST (Central GST) and SGST (State GST) in equal parts. If the tax slab is 18%, it will be split into 9% CGST and 9% SGST.'
    }
  ],
  'Invoice types and when to use them': [
    {
      question: 'What invoice document must a Composition Scheme dealer issue for their taxable outward supplies?',
      options: [
        'Bill of Supply',
        'Tax Invoice',
        'Delivery Challan',
        'Receipt Voucher'
      ],
      correctIndex: 0,
      explanation: 'Composition scheme dealers are prohibited from collecting tax from customers and cannot issue Tax Invoices. Instead, they must issue a "Bill of Supply" indicating their composition scheme status.'
    }
  ],
  'Monthly returns: GSTR-1 and GSTR-3B': [
    {
      question: 'What is the main difference between GSTR-1 and GSTR-3B filings?',
      options: [
        'GSTR-1 reports invoice-level sales, while GSTR-3B is a monthly summary return where net tax is paid',
        'GSTR-1 is for purchasing goods, and GSTR-3B is for services',
        'GSTR-1 is filed by regular dealers, and GSTR-3B is for composition scheme dealers',
        'There is no difference; they are duplicate forms'
      ],
      correctIndex: 0,
      explanation: 'GSTR-1 is the return for outward supplies (sales detail) and GSTR-3B is the monthly self-declaration summary where output tax liability is declared, ITC is claimed, and net tax is paid.'
    }
  ],
  'Late filing penalties and interest': [
    {
      question: 'What is the interest rate charged on net GST payable when a return is filed past its due date?',
      options: [
        '18% per annum pro-rated daily',
        '12% per annum pro-rated monthly',
        '24% flat penalty fee',
        'Interest is not charged, only a late fee applies'
      ],
      correctIndex: 0,
      explanation: 'Interest under Section 50 of the GST Act is levied at 18% per annum on the net tax liability paid in cash (excluding ITC portion) from the day following the deadline until the date of payment.'
    }
  ],
  'Composition scheme rules and restrictions': [
    {
      question: 'Which of the following is true for a business registered under the Composition Scheme?',
      options: [
        'They cannot claim Input Tax Credit (ITC) on purchases',
        'They can sell goods across state borders (inter-state outward sales)',
        'They can collect tax from their customers',
        'Their tax rates are higher than regular scheme rates'
      ],
      correctIndex: 0,
      explanation: 'Composition dealers are restricted: they cannot claim any Input Tax Credit (ITC) on purchases, cannot collect GST from buyers, cannot make inter-state sales, and pay a flat low percentage (e.g. 1% or 5%) on total turnover.'
    }
  ]
};

const DEFAULT_QUIZ_QUESTION = {
  question: 'What is the primary objective of the Goods and Services Tax (GST) in India?',
  options: [
    'To consolidate multiple indirect taxes into a unified system ("One Nation, One Tax")',
    'To increase the tax rate on essential food items',
    'To eliminate direct income taxes',
    'To regulate stock market transactions'
  ],
  correctIndex: 0,
  explanation: 'GST was implemented in India on July 1, 2017, as a comprehensive indirect tax to unify CGST, SGST, IGST, excise, VAT, and service taxes, reducing the cascading effect of taxation.'
};

// ============================================================
// LOCAL STORAGE DATABASE ACCESSORS
// ============================================================

const getLocal = (key, defaultVal = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setLocal = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize database if empty
const initOfflineDatabase = () => {
  if (!localStorage.getItem('gst_offline_biz_templates')) {
    setLocal('gst_offline_biz_templates', OFFLINE_BUSINESS_TEMPLATES);
  }
  if (!localStorage.getItem('gst_offline_npc_businesses')) {
    setLocal('gst_offline_npc_businesses', OFFLINE_NPC_BUSINESSES);
  }
};

initOfflineDatabase();

// ============================================================
// SIMULATION ENGINE MATH HELPERS
// ============================================================

const generateMockInvoiceNum = (month, year) => {
  const m = String(month).padStart(2, '0');
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `GST-OFF-${year}-${m}-${rand}`;
};

// ============================================================
// OFFLINE API CONTROLLERS
// ============================================================

export const offlineClient = {
  // --- Tax & HSN ---
  getTaxSlabs: async () => OFFLINE_TAX_SLABS,
  
  getHsnCodes: async (search = '') => {
    const q = search.toLowerCase();
    return OFFLINE_HSN_CODES.filter(h => 
      h.code.includes(q) || h.description.toLowerCase().includes(q)
    );
  },

  calculateGST: async (data) => {
    const val = Number(data.taxableValue);
    const r = Number(data.rate);
    const isInterstate = !!data.isInterstate;
    const type = data.transactionType || 'regular';

    if (type === 'export' || type === 'exempt' || r === 0) {
      return { cgst: 0, sgst: 0, igst: 0, totalTax: 0, totalValue: val };
    }
    const taxAmount = Math.round(val * r / 100 * 100) / 100;
    if (isInterstate) {
      return { cgst: 0, sgst: 0, igst: taxAmount, totalTax: taxAmount, totalValue: val + taxAmount };
    } else {
      const half = Math.round(taxAmount / 2 * 100) / 100;
      return { cgst: half, sgst: half, igst: 0, totalTax: taxAmount, totalValue: val + taxAmount };
    }
  },

  // --- Auth / User / Session ---
  studentLogin: async ({ email, inviteCode }) => {
    const user = {
      id: 'offline-student-id',
      name: 'Offline Student',
      email: email || 'offline@aadhirasolutions.com',
      role: 'student',
      invite_code: inviteCode || 'OFFLINE-100'
    };
    setLocal('gst_offline_user', user);
    localStorage.setItem('auth_token', 'offline-mock-jwt-token');

    // Retrieve active business
    const activeBiz = getLocal('gst_offline_active_business', null);
    
    return {
      token: 'offline-mock-jwt-token',
      user,
      business: activeBiz
    };
  },

  getCurrentUser: async () => {
    const user = getLocal('gst_offline_user', {
      id: 'offline-student-id',
      name: 'Offline Student',
      email: 'offline@aadhirasolutions.com',
      role: 'student'
    });
    const activeBiz = getLocal('gst_offline_active_business', null);
    return {
      ...user,
      business: activeBiz
    };
  },

  // --- Businesses ---
  getUnassignedBusinesses: async () => {
    const templates = getLocal('gst_offline_biz_templates');
    const claimedId = getLocal('gst_offline_active_business')?.id;
    return templates.filter(b => b.id !== claimedId);
  },

  createBusiness: async (data) => {
    const { name, state, scheme_type } = data;
    if (!name || !state) throw new Error('Business name and state are required.');

    const state_code = STATE_CODES[state];
    if (!state_code) throw new Error(`Unknown state: ${state}`);

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const randomString = (length, chars) => {
      let result = '';
      for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    };
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '').padEnd(4, 'A');
    const panLike = cleanName.slice(0, 4) + 'A' + randomString(4, digits) + randomString(1, letters);
    const entity = randomString(1, digits);
    const checksum = randomString(1, digits);
    const gstin = `${state_code}${panLike}${entity}Z${checksum}`;

    const biz = {
      id: `offline-custom-${Math.random().toString(36).substring(2, 9)}`,
      name,
      gstin,
      state,
      state_code,
      scheme_type: scheme_type || 'regular',
      is_npc: false
    };

    setLocal('gst_offline_active_business', biz);

    const customList = getLocal('gst_offline_custom_businesses') || [];
    customList.push(biz);
    setLocal('gst_offline_custom_businesses', customList);

    const now = new Date();
    let currentMonth = now.getMonth() + 1;
    let currentYear = now.getFullYear();

    const periodsKey = `gst_offline_periods_${biz.id}`;
    const periods = [];
    for (let i = 0; i < 3; i++) {
      let m = currentMonth + i;
      let y = currentYear;
      if (m > 12) {
        m -= 12;
        y += 1;
      }
      
      let dlMonth = m + 1;
      let dlYear = y;
      if (dlMonth > 12) {
        dlMonth -= 12;
        dlYear += 1;
      }
      const dlDate = new Date(dlYear, dlMonth - 1, 20).toISOString();

      periods.push({
        id: `off-period-${biz.id}-${y}-${m}`,
        business_id: biz.id,
        month: m,
        year: y,
        status: i === 0 ? 'open' : 'future',
        deadline_date: dlDate,
        gstr1_id: null,
        gstr3b_id: null,
        net_payable: null,
        carry_forward: 0,
        is_late: false
      });
    }
    setLocal(periodsKey, periods);

    if (biz.scheme_type === 'regular') {
      const invoicesKey = `gst_offline_invoices_${biz.id}`;
      const firstPeriod = periods[0];
      const npc1 = OFFLINE_NPC_BUSINESSES[0];
      const npc2 = OFFLINE_NPC_BUSINESSES[1];

      const generateMockInvoiceNum = (mon, yr) => {
        const rand = Math.floor(Math.random() * 900000) + 100000;
        return `GST-OFF-${yr}-${String(mon).padStart(2, '0')}-${rand}`;
      };

      const seedInvoices = [
        {
          id: 'seed-purchase-1',
          invoice_number: generateMockInvoiceNum(firstPeriod.month, firstPeriod.year),
          seller_business_id: npc1.id,
          seller_name: npc1.name,
          seller_gstin: npc1.gstin,
          seller_state: npc1.state,
          buyer_business_id: biz.id,
          buyer_name: biz.name,
          buyer_gstin: biz.gstin,
          buyer_state: biz.state,
          is_interstate: biz.state !== npc1.state,
          tax_period_id: firstPeriod.id,
          invoice_type: 'tax_invoice',
          transaction_type: 'regular',
          notes: 'Pre-seeded purchase invoice for ITC practice',
          created_at: new Date(currentYear, currentMonth - 1, 5).toISOString(),
          items: [
            {
              id: 101,
              item_name: 'Raw Materials Grade A',
              hsn_code: '8471',
              qty: 10,
              unit_price: 15000,
              tax_rate: 18,
              taxable_value: 150000,
              cgst: biz.state === npc1.state ? 13500 : 0,
              sgst: biz.state === npc1.state ? 13500 : 0,
              igst: biz.state !== npc1.state ? 27000 : 0,
              total_value: 177000
            }
          ]
        },
        {
          id: 'seed-purchase-2',
          invoice_number: generateMockInvoiceNum(firstPeriod.month, firstPeriod.year),
          seller_business_id: npc2.id,
          seller_name: npc2.name,
          seller_gstin: npc2.gstin,
          seller_state: npc2.state,
          buyer_business_id: biz.id,
          buyer_name: biz.name,
          buyer_gstin: biz.gstin,
          buyer_state: biz.state,
          is_interstate: biz.state !== npc2.state,
          tax_period_id: firstPeriod.id,
          invoice_type: 'tax_invoice',
          transaction_type: 'regular',
          notes: 'Pre-seeded purchase invoice for ITC practice',
          created_at: new Date(currentYear, currentMonth - 1, 10).toISOString(),
          items: [
            {
              id: 102,
              item_name: 'Office Computers',
              hsn_code: '8471',
              qty: 2,
              unit_price: 35000,
              tax_rate: 18,
              taxable_value: 70000,
              cgst: biz.state === npc2.state ? 6300 : 0,
              sgst: biz.state === npc2.state ? 6300 : 0,
              igst: biz.state !== npc2.state ? 12600 : 0,
              total_value: 82600
            }
          ]
        }
      ];
      setLocal(invoicesKey, seedInvoices);

      const ledgerKey = `gst_offline_ledger_${biz.id}`;
      const seedLedger = [
        {
          id: 'seed-ledger-1',
          business_id: biz.id,
          tax_period_id: firstPeriod.id,
          source_invoice_id: seedInvoices[0].id,
          entry_type: 'input',
          cgst_amount: biz.state === npc1.state ? 13500 : 0,
          sgst_amount: biz.state === npc1.state ? 13500 : 0,
          igst_amount: biz.state !== npc1.state ? 27000 : 0,
          amount: 27000,
          match_status: 'matched',
          created_at: new Date(currentYear, currentMonth - 1, 5).toISOString()
        },
        {
          id: 'seed-ledger-2',
          business_id: biz.id,
          tax_period_id: firstPeriod.id,
          source_invoice_id: seedInvoices[1].id,
          entry_type: 'input',
          cgst_amount: biz.state === npc2.state ? 6300 : 0,
          sgst_amount: biz.state === npc2.state ? 6300 : 0,
          igst_amount: biz.state !== npc2.state ? 12600 : 0,
          amount: 12600,
          match_status: 'pending',
          created_at: new Date(currentYear, currentMonth - 1, 10).toISOString()
        }
      ];
      setLocal(ledgerKey, seedLedger);
    }

    return biz;
  },

  claimBusiness: async (id) => {
    const templates = getLocal('gst_offline_biz_templates');
    const biz = templates.find(b => b.id === id);
    if (!biz) throw new Error('Simulation profile not found.');

    setLocal('gst_offline_active_business', biz);
    
    // Initialize periods for this claimed business
    const now = new Date();
    let currentMonth = now.getMonth() + 1; // 1-12
    let currentYear = now.getFullYear();

    const periodsKey = `gst_offline_periods_${biz.id}`;
    if (!localStorage.getItem(periodsKey)) {
      const periods = [];
      // Generate 3 periods (e.g. current month, and next 2 months)
      for (let i = 0; i < 3; i++) {
        let m = currentMonth + i;
        let y = currentYear;
        if (m > 12) {
          m -= 12;
          y += 1;
        }
        
        // Deadline is the 20th of the following month
        let dlMonth = m + 1;
        let dlYear = y;
        if (dlMonth > 12) {
          dlMonth -= 12;
          dlYear += 1;
        }
        const dlDate = new Date(dlYear, dlMonth - 1, 20).toISOString();

        periods.push({
          id: `off-period-${biz.id}-${y}-${m}`,
          business_id: biz.id,
          month: m,
          year: y,
          status: i === 0 ? 'open' : 'future',
          deadline_date: dlDate,
          gstr1_id: null,
          gstr3b_id: null,
          net_payable: null,
          carry_forward: 0,
          is_late: false
        });
      }
      setLocal(periodsKey, periods);

      // Generate seed purchase invoices (supplier inputs) so the student has Matched/Pending ITC to learn!
      const invoicesKey = `gst_offline_invoices_${biz.id}`;
      const firstPeriod = periods[0];
      const npc1 = OFFLINE_NPC_BUSINESSES[0]; // Maharashtra supplier
      const npc2 = OFFLINE_NPC_BUSINESSES[1]; // Karnataka supplier

      const seedInvoices = [
        {
          id: 'seed-purchase-1',
          invoice_number: generateMockInvoiceNum(firstPeriod.month, firstPeriod.year),
          seller_business_id: npc1.id,
          seller_name: npc1.name,
          seller_gstin: npc1.gstin,
          seller_state: npc1.state,
          buyer_business_id: biz.id,
          buyer_name: biz.name,
          buyer_gstin: biz.gstin,
          buyer_state: biz.state,
          is_interstate: biz.state !== npc1.state,
          tax_period_id: firstPeriod.id,
          invoice_type: 'tax_invoice',
          transaction_type: 'regular',
          notes: 'Pre-seeded purchase invoice for ITC practice',
          created_at: new Date(currentYear, currentMonth - 1, 5).toISOString(),
          items: [
            {
              id: 101,
              item_name: 'Raw Materials Grade A',
              hsn_code: '8471',
              qty: 10,
              unit_price: 15000,
              tax_rate: 18,
              taxable_value: 150000,
              cgst: biz.state === npc1.state ? 13500 : 0,
              sgst: biz.state === npc1.state ? 13500 : 0,
              igst: biz.state !== npc1.state ? 27000 : 0,
              total_value: 177000
            }
          ]
        },
        {
          id: 'seed-purchase-2',
          invoice_number: generateMockInvoiceNum(firstPeriod.month, firstPeriod.year),
          seller_business_id: npc2.id,
          seller_name: npc2.name,
          seller_gstin: npc2.gstin,
          seller_state: npc2.state,
          buyer_business_id: biz.id,
          buyer_name: biz.name,
          buyer_gstin: biz.gstin,
          buyer_state: biz.state,
          is_interstate: biz.state !== npc2.state,
          tax_period_id: firstPeriod.id,
          invoice_type: 'tax_invoice',
          transaction_type: 'regular',
          notes: 'Pre-seeded purchase from inter-state supplier',
          created_at: new Date(currentYear, currentMonth - 1, 8).toISOString(),
          items: [
            {
              id: 102,
              item_name: 'Office Computers',
              hsn_code: '8471',
              qty: 2,
              unit_price: 35000,
              tax_rate: 18,
              taxable_value: 70000,
              cgst: biz.state === npc2.state ? 6300 : 0,
              sgst: biz.state === npc2.state ? 6300 : 0,
              igst: biz.state !== npc2.state ? 12600 : 0,
              total_value: 82600
            }
          ]
        }
      ];

      setLocal(invoicesKey, seedInvoices);

      // Create ledger input entries for the purchased goods
      const ledgerKey = `gst_offline_ledger_${biz.id}`;
      const ledgerEntries = seedInvoices.map((inv) => {
        const item = inv.items[0];
        const cgst = Number(item.cgst);
        const sgst = Number(item.sgst);
        const igst = Number(item.igst);
        const totalTax = cgst + sgst + igst;

        return {
          id: `ledger-${inv.id}`,
          business_id: biz.id,
          tax_period_id: firstPeriod.id,
          source_invoice_id: inv.id,
          entry_type: 'input',
          cgst_amount: cgst,
          sgst_amount: sgst,
          igst_amount: igst,
          amount: totalTax,
          // One supplier has filed (matched), one has not (pending) to teach ITC reconciliation
          match_status: inv.id === 'seed-purchase-1' ? 'matched' : 'pending',
          created_at: inv.created_at,
          invoice_number: inv.invoice_number,
          invoice_type: inv.invoice_type,
          transaction_type: inv.transaction_type,
          seller_name: inv.seller_name,
          seller_gstin: inv.seller_gstin,
          buyer_name: inv.buyer_name,
          buyer_gstin: inv.buyer_gstin
        };
      });
      setLocal(ledgerKey, ledgerEntries);
    }

    return biz;
  },

  getBusiness: async (id) => {
    const templates = getLocal('gst_offline_biz_templates');
    const biz = templates.find(b => b.id === id);
    if (!biz) throw new Error('Business scenario not found.');
    return biz;
  },

  listBusinesses: async (sessionId) => {
    // List all including NPCs
    const templates = getLocal('gst_offline_biz_templates');
    const npcs = getLocal('gst_offline_npc_businesses');
    return [...templates, ...npcs];
  },

  // --- Invoices ---
  createInvoice: async (data) => {
    const bizId = data.seller_business_id;
    const invoiceNum = generateMockInvoiceNum(1, 2026); // Dummy month/year generator, actual updated below
    
    // Fetch active business
    const activeBiz = getLocal('gst_offline_active_business');
    if (!activeBiz || activeBiz.id !== bizId) throw new Error('Seller business mismatch.');

    // Fetch periods
    const periodsKey = `gst_offline_periods_${bizId}`;
    const periods = getLocal(periodsKey);
    const period = periods.find(p => p.id === data.tax_period_id);
    if (!period) throw new Error('Filing tax period not found.');
    if (period.status !== 'open') throw new Error(`Cannot add invoices to a ${period.status} period.`);

    // Fetch buyer info
    let buyer = null;
    if (data.buyer_business_id) {
      const allBiz = await offlineClient.listBusinesses();
      buyer = allBiz.find(b => b.id === data.buyer_business_id);
    }

    const sellerStateCode = activeBiz.state_code;
    const buyerStateCode = buyer?.state_code || null;
    const isInterstate = buyerStateCode ? sellerStateCode !== buyerStateCode : false;

    // Generate real invoice number based on period
    const formattedInvoiceNum = generateMockInvoiceNum(period.month, period.year);

    // Calculate tax amounts and save items
    let totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0, grandTotal = 0;
    const insertedItems = data.items.map((item, idx) => {
      const taxableValue = Math.round(item.qty * item.unit_price * 100) / 100;
      let cgst = 0, sgst = 0, igst = 0;

      if (item.transaction_type !== 'exempt' && item.transaction_type !== 'export' && item.tax_rate > 0) {
        const taxAmount = Math.round(taxableValue * item.tax_rate / 100 * 100) / 100;
        if (isInterstate) {
          igst = taxAmount;
        } else {
          cgst = Math.round(taxAmount / 2 * 100) / 100;
          sgst = Math.round(taxAmount / 2 * 100) / 100;
        }
      }

      const totalVal = taxableValue + cgst + sgst + igst;
      totalTaxable += taxableValue;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;
      grandTotal += totalVal;

      return {
        id: `off-item-${Date.now()}-${idx}`,
        item_name: item.item_name,
        hsn_code: item.hsn_code,
        qty: item.qty,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        taxable_value: taxableValue,
        cgst,
        sgst,
        igst,
        total_value: totalVal
      };
    });

    const totalTax = totalCGST + totalSGST + totalIGST;

    const newInvoice = {
      id: `off-inv-${Date.now()}`,
      invoice_number: formattedInvoiceNum,
      seller_business_id: activeBiz.id,
      seller_name: activeBiz.name,
      seller_gstin: activeBiz.gstin,
      seller_state: activeBiz.state,
      buyer_business_id: data.buyer_business_id || null,
      buyer_name: buyer?.name || data.buyer_name || 'B2C Customer',
      buyer_gstin: buyer?.gstin || data.buyer_gstin || null,
      buyer_state: buyer?.state || data.buyer_state || activeBiz.state,
      is_interstate: isInterstate,
      tax_period_id: data.tax_period_id,
      invoice_type: data.invoice_type,
      transaction_type: data.transaction_type,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      items: insertedItems
    };

    // Save to invoices array
    const invoicesKey = `gst_offline_invoices_${bizId}`;
    const invoices = getLocal(invoicesKey);
    invoices.push(newInvoice);
    setLocal(invoicesKey, invoices);

    // Save output ledger entry for the seller (us)
    const ledgerKey = `gst_offline_ledger_${bizId}`;
    const ledger = getLocal(ledgerKey);

    ledger.push({
      id: `ledger-${newInvoice.id}-out`,
      business_id: bizId,
      tax_period_id: data.tax_period_id,
      source_invoice_id: newInvoice.id,
      entry_type: 'output',
      cgst_amount: totalCGST,
      sgst_amount: totalSGST,
      igst_amount: totalIGST,
      amount: totalTax,
      match_status: 'matched',
      created_at: newInvoice.created_at,
      invoice_number: newInvoice.invoice_number,
      invoice_type: newInvoice.invoice_type,
      transaction_type: newInvoice.transaction_type,
      seller_name: activeBiz.name,
      seller_gstin: activeBiz.gstin,
      buyer_name: newInvoice.buyer_name,
      buyer_gstin: newInvoice.buyer_gstin
    });
    setLocal(ledgerKey, ledger);

    return {
      invoice: newInvoice,
      totals: {
        taxableTotal: totalTaxable,
        cgstTotal: totalCGST,
        sgstTotal: totalSGST,
        igstTotal: totalIGST,
        totalTax,
        grandTotal
      }
    };
  },

  getInvoice: async (id) => {
    const activeBiz = getLocal('gst_offline_active_business');
    if (!activeBiz) throw new Error('No active business.');

    const invoices = getLocal(`gst_offline_invoices_${activeBiz.id}`);
    const inv = invoices.find(i => i.id === id);
    if (!inv) throw new Error('Invoice not found.');
    return inv;
  },

  getBusinessInvoices: async (bizId, periodId) => {
    const invoices = getLocal(`gst_offline_invoices_${bizId}`);
    if (periodId) {
      return invoices.filter(i => i.tax_period_id === periodId);
    }
    return invoices;
  },

  // --- ITC Ledger & Periods ---
  getPeriods: async (bizId) => {
    const periodsKey = `gst_offline_periods_${bizId}`;
    return getLocal(periodsKey);
  },

  getITCSummary: async (bizId, periodId) => {
    const ledgerKey = `gst_offline_ledger_${bizId}`;
    const ledger = getLocal(ledgerKey);
    const periodLedger = ledger.filter(e => e.tax_period_id === periodId);

    let outputTax = 0, matchedITC = 0, pendingITC = 0, blockedITC = 0;
    
    periodLedger.forEach(row => {
      const amt = Number(row.amount) || 0;
      if (row.entry_type === 'output') {
        outputTax += amt;
      } else if (row.entry_type === 'input') {
        if (row.match_status === 'matched') matchedITC += amt;
        else if (row.match_status === 'pending') pendingITC += amt;
        else if (row.match_status === 'blocked') blockedITC += amt;
      }
    });

    const netPayable = Math.max(0, outputTax - matchedITC);
    const carryForward = Math.max(0, matchedITC - outputTax);

    return {
      businessId: bizId,
      periodId,
      outputTax,
      matchedITC,
      pendingITC,
      blockedITC,
      netPayable,
      carryForward,
      entries: periodLedger
    };
  },

  closePeriod: async (periodId, businessId) => {
    const periodsKey = `gst_offline_periods_${businessId}`;
    const periods = getLocal(periodsKey);
    const periodIdx = periods.findIndex(p => p.id === periodId);
    if (periodIdx === -1) throw new Error('Period not found.');

    const period = periods[periodIdx];
    if (period.status === 'closed' || period.status === 'filed') {
      return { alreadyClosed: true };
    }

    period.status = 'closed';
    period.gstr1_id = `off-gstr1-${periodId}`;
    
    // Simulate supplier filing GSTR-1: transition 'pending' purchase invoice inputs to 'matched'
    // This allows the user to offset their liabilities during GSTR-3B filing!
    const ledgerKey = `gst_offline_ledger_${businessId}`;
    const ledger = getLocal(ledgerKey);
    ledger.forEach(entry => {
      if (entry.tax_period_id === periodId && entry.entry_type === 'input' && entry.match_status === 'pending') {
        entry.match_status = 'matched';
      }
    });
    setLocal(ledgerKey, ledger);
    setLocal(periodsKey, periods);

    return { alreadyClosed: false };
  },

  getFilingPreview: async (periodId, businessId) => {
    const summary = await offlineClient.getITCSummary(businessId, periodId);
    const periods = getLocal(`gst_offline_periods_${businessId}`);
    const period = periods.find(p => p.id === periodId);
    
    // Check late penalty
    const now = new Date();
    const deadline = new Date(period.deadline_date);
    
    let isLate = now > deadline;
    let daysOverdue = 0;
    let interest = 0;
    let penalty = 0;

    if (isLate) {
      const diffTime = Math.abs(now - deadline);
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // 18% p.a. pro-rated daily
      interest = Math.round((summary.netPayable * 0.18 * daysOverdue / 365) * 100) / 100;
      // ₹50 per day
      penalty = Math.min(50 * daysOverdue, 5000);
    }

    return {
      period,
      outputTax: summary.outputTax,
      matchedITC: summary.matchedITC,
      pendingITC: summary.pendingITC,
      netPayable: summary.netPayable,
      carryForward: summary.carryForward,
      isLate,
      daysOverdue,
      interest,
      penalty
    };
  },

  filePeriod: async (periodId, businessId) => {
    const periodsKey = `gst_offline_periods_${businessId}`;
    const periods = getLocal(periodsKey);
    const periodIdx = periods.findIndex(p => p.id === periodId);
    if (periodIdx === -1) throw new Error('Period not found.');

    const period = periods[periodIdx];
    if (period.status === 'filed') {
      return { alreadyFiled: true, period };
    }

    const preview = await offlineClient.getFilingPreview(periodId, businessId);

    // Lock the period
    period.status = 'filed';
    period.gstr3b_id = `off-gstr3b-${periodId}`;
    period.net_payable = preview.netPayable;
    period.carry_forward = preview.carryForward;
    period.is_late = preview.isLate;

    // Set late penalty metadata
    const filingSummary = {
      isLate: preview.isLate,
      daysOverdue: preview.daysOverdue,
      interest: preview.interest,
      penalty: preview.penalty
    };

    // Carry forward calculation: update carry_forward in subsequent open period
    const openPeriod = periods.find(p => p.status === 'open');
    if (openPeriod) {
      openPeriod.carry_forward = preview.carryForward;
    }

    // Set the next future period to open if current is closed/filed
    const nextPeriod = periods.find(p => p.status === 'future');
    if (nextPeriod) {
      nextPeriod.status = 'open';
    }

    setLocal(periodsKey, periods);

    return {
      alreadyFiled: false,
      period,
      summary: filingSummary
    };
  },

  // --- AI Explanations & Tutor chat ---
  explainITCStatus: async (ledgerEntryId) => {
    // Read ledger entry
    const activeBiz = getLocal('gst_offline_active_business');
    const ledger = getLocal(`gst_offline_ledger_${activeBiz.id}`);
    const entry = ledger.find(e => e.id === ledgerEntryId);

    if (!entry) return { explanation: 'Ledger entry not found.' };

    if (entry.match_status === 'matched') {
      return {
        explanation: `This Input Tax Credit (ITC) entry is **Matched**. The supplier (${entry.seller_name}) has successfully filed their GSTR-1 return, which maps to your GSTR-2B. You are legally allowed to deduct ₹${entry.amount} from your outward tax liability.`
      };
    } else if (entry.match_status === 'pending') {
      return {
        explanation: `This ITC entry of ₹${entry.amount} is **Pending**. The supplier (${entry.seller_name}) has issued the invoice, but has not yet filed their monthly GSTR-1. Under GST rules, you cannot claim this credit until they file their return. We simulated matching this automatically for you when you Closed the current Tax Period.`
      };
    } else {
      return {
        explanation: `This ITC entry is **Blocked**. Under Section 17(5) of the GST Act, certain categories of inputs (like motor vehicles, food & beverages, personal consumption) are ineligible for claiming tax credits even if a valid tax invoice exists.`
      };
    }
  },

  tutorChat: async ({ message }) => {
    const q = message.toLowerCase();
    let reply = '';

    if (q.includes('itc') || q.includes('input tax credit')) {
      reply = `**Input Tax Credit (ITC)** is the tax you paid on purchase of goods or services. You can use it to reduce the tax you collect on sales (output tax). 
      
      *For example*: If you collect ₹100 on sales and paid ₹60 on purchases, your net tax payable is only ₹40 (₹100 - ₹60). Under Section 16, to claim ITC, you must hold a valid tax invoice and the supplier must upload it.`;
    } else if (q.includes('igst') || q.includes('interstate')) {
      reply = `**IGST (Integrated Goods and Services Tax)** applies to all **inter-state** (between two different states) transactions. 
      
      It is collected by the Central Government and distributed to the destination state. If you sell from Maharashtra to Delhi, you apply IGST at the full rate (e.g. 18%).`;
    } else if (q.includes('cgst') || q.includes('sgst') || q.includes('intrastate')) {
      reply = `**CGST (Central GST)** and **SGST (State GST)** apply to **intra-state** transactions (within the same state, e.g., Maharashtra to Maharashtra).
      
      The tax rate is divided equally. For instance, a standard 18% GST slab is charged as **9% CGST** and **9% SGST**.`;
    } else if (q.includes('gstr-3b') || q.includes('gstr3b') || q.includes('3b')) {
      reply = `**GSTR-3B** is a simplified summary return filed monthly. 
      
      In this return, you report your total sales, matched ITC, calculate net tax payable, and make the payment. It must be filed by the 20th of the following month. Late filing charges 18% p.a. interest + ₹50/day penalty.`;
    } else if (q.includes('gstr-1') || q.includes('gstr1')) {
      reply = `**GSTR-1** is the return where you report invoice-wise details of all your outward supplies (sales). 
      
      It is filed by the 11th of the following month. Filing GSTR-1 propagates invoice data to your buyers\' GSTR-2B ledgers so they can claim their ITC.`;
    } else if (q.includes('composition')) {
      reply = `The **Composition Scheme** is a quick, hassle-free option for small taxpayers (turnover under ₹1.5 crore). 
      
      *Key constraints:*
      1. You pay a low flat rate (e.g. 1% for traders) on total turnover directly.
      2. You **cannot claim ITC** on purchases.
      3. You **cannot collect tax** from customers (must issue a Bill of Supply instead of a Tax Invoice).`;
    } else if (q.includes('hsn')) {
      reply = `**HSN (Harmonized System of Nomenclature)** is a standardized multi-digit code used globally to classify goods for taxation. 
      
      In India, HSN codes group goods and services into specific tax slabs (0%, 5%, 12%, 18%, 28%). Services use a similar classification code called SAC.`;
    } else if (q.includes('late') || q.includes('penalty') || q.includes('interest')) {
      reply = `If you file GSTR-3B past the 20th deadline:
      1. **Late fee**: ₹50 per day (₹20/day for NIL returns), capped at ₹5,000.
      2. **Interest**: 18% per annum calculated daily on the net cash liability.`;
    } else {
      reply = `Hello! I am your offline **GST Tutor**. Since we are in **Offline Sandbox Mode**, I am running locally. 
      
      I can explain GST rules, GSTR-1/3B filing deadlines, ITC claims, and the Composition Scheme. Try asking:
      - *"What is ITC?"*
      - *"Explain the composition scheme"*
      - *"When does IGST apply?"*
      - *"GSTR-3B details"*`;
    }

    return { reply };
  },

  // --- Quizzes ---
  generateQuizQuestion: async (topic) => {
    const list = OFFLINE_QUIZ_QUESTIONS[topic] || [];
    if (list.length === 0) return DEFAULT_QUIZ_QUESTION;
    const randIdx = Math.floor(Math.random() * list.length);
    return {
      topic,
      ...list[randIdx]
    };
  },

  saveQuizAttempt: async (data) => {
    const attempts = getLocal('gst_offline_quiz_attempts');
    attempts.push({
      ...data,
      date: new Date().toISOString()
    });
    setLocal('gst_offline_quiz_attempts', attempts);
    return { success: true };
  },

  getStudentQuizzes: async () => {
    return [
      { id: 'off-q-1', title: 'GST Basics & Core Concepts', total_questions: 3, difficulty: 'Easy' },
      { id: 'off-q-2', title: 'Input Tax Credit (ITC) Rules', total_questions: 3, difficulty: 'Medium' }
    ];
  },

  getStudentQuizDetails: async (id) => {
    if (id === 'off-q-1') {
      return {
        id: 'off-q-1',
        title: 'GST Basics & Core Concepts',
        questions: [
          {
            id: 'q1',
            question: 'Which GST is levied on intra-state supplies?',
            options: ['CGST only', 'SGST only', 'Both CGST and SGST', 'IGST'],
            correctIndex: 2
          },
          {
            id: 'q2',
            question: 'What does HSN stand for in GST?',
            options: ['Harmonized System of Nomenclature', 'Home State Network', 'High Speed Number', 'Honorable Tax System'],
            correctIndex: 0
          },
          {
            id: 'q3',
            question: 'A bakery registered under the Composition Scheme can collect GST from customers.',
            options: ['True', 'False'],
            correctIndex: 1
          }
        ]
      };
    } else {
      return {
        id: 'off-q-2',
        title: 'Input Tax Credit (ITC) Rules',
        questions: [
          {
            id: 'q4',
            question: 'Which of the following is eligible for claiming ITC?',
            options: ['Office laptops for business operations', 'Food and beverages for staff lunch', 'Personal car for director\'s family', 'Gym membership for employees'],
            correctIndex: 0
          },
          {
            id: 'q5',
            question: 'To claim ITC, a purchase invoice must be uploaded by the supplier in GSTR-1 and appear in the buyer\'s GSTR-2B.',
            options: ['True', 'False'],
            correctIndex: 0
          },
          {
            id: 'q6',
            question: 'Under the Composition Scheme, a business can claim ITC on all purchases.',
            options: ['True', 'False'],
            correctIndex: 1
          }
        ]
      };
    }
  },

  submitStudentQuiz: async (id, answers) => {
    // Calculate score
    const details = await offlineClient.getStudentQuizDetails(id);
    let correct = 0;
    details.questions.forEach((q, idx) => {
      if (answers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    return {
      score: correct,
      total: details.questions.length,
      passed: correct >= details.questions.length / 2,
      answersSummary: details.questions.map(q => ({
        question: q.question,
        userAnswer: answers[q.id],
        correctAnswer: q.correctIndex,
        isCorrect: answers[q.id] === q.correctIndex
      }))
    };
  },

  // --- Business Scenarios (offline) ---
  getUnassignedBusinesses: async () => {
    // Return templates that have not been claimed yet
    const claimed = getLocal('gst_offline_claimed_biz_ids') || [];
    return OFFLINE_BUSINESS_TEMPLATES.filter(b => !claimed.includes(b.id));
  },

  claimBusiness: async (id) => {
    const biz = OFFLINE_BUSINESS_TEMPLATES.find(b => b.id === id);
    if (!biz) throw new Error('Business scenario not found.');
    // Mark as claimed
    const claimed = getLocal('gst_offline_claimed_biz_ids') || [];
    if (!claimed.includes(id)) {
      setLocal('gst_offline_claimed_biz_ids', [...claimed, id]);
    }
    // Persist as the active business
    setLocal('gst_offline_active_business', biz);
    // Seed default ITC ledger entries for this business
    const ledgerKey = `gst_offline_ledger_${biz.id}`;
    if (!getLocal(ledgerKey) || getLocal(ledgerKey).length === 0) {
      setLocal(ledgerKey, [
        {
          id: `itc-${biz.id}-1`,
          type: 'input',
          amount: 9000,
          cgst: 4500,
          sgst: 4500,
          igst: 0,
          match_status: 'matched',
          seller_name: 'Maharashtra Suppliers Ltd',
          seller_gstin: '27AAACM1234A1Z5',
          description: 'Office supplies purchase',
          created_at: new Date(Date.now() - 10 * 24 * 3600000).toISOString()
        },
        {
          id: `itc-${biz.id}-2`,
          type: 'input',
          amount: 18000,
          cgst: 0,
          sgst: 0,
          igst: 18000,
          match_status: 'pending',
          seller_name: 'Karnataka Distributors Hub',
          seller_gstin: '29AAACK5678B1Z3',
          description: 'Raw material purchase',
          created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
        }
      ]);
    }
    return { ...biz, owner_id: 'offline-user' };
  }
};

export default offlineClient;

