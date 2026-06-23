import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  // Period statuses
  open: { label: 'Open', color: 'info' },
  closed: { label: 'Closed', color: 'warning' },
  filed: { label: 'Filed', color: 'success' },
  late: { label: 'Late Filed', color: 'error' },
  // Match statuses
  matched: { label: 'Matched', color: 'success' },
  pending: { label: 'Pending', color: 'warning' },
  blocked: { label: 'Blocked', color: 'error' },
  // Scheme
  regular: { label: 'Regular', color: 'primary' },
  composition: { label: 'Composition', color: 'secondary' },
  // Invoice types
  tax_invoice: { label: 'Tax Invoice', color: 'primary' },
  bill_of_supply: { label: 'Bill of Supply', color: 'default' },
  credit_note: { label: 'Credit Note', color: 'error' },
  debit_note: { label: 'Debit Note', color: 'warning' },
  quotation: { label: 'Quotation', color: 'info' },
  delivery_challan: { label: 'Delivery Challan', color: 'secondary' },
  // Transaction types
  regular_tx: { label: 'Regular', color: 'default' },
  export: { label: 'Export', color: 'info' },
  exempt: { label: 'Exempt', color: 'default' },
  reverse_charge: { label: 'RCM', color: 'secondary' },
};

export default function StatusChip({ status, size = 'small', sx = {} }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 700, ...sx }}
    />
  );
}
