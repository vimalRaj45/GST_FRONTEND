import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Alert, CircularProgress, Stack, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip,
  Card, CardContent, Grid, IconButton, Autocomplete, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import { BsBoxSeam as BoxIcon, BsPlusCircle as PlusIcon, BsTrash as TrashIcon, BsExclamationTriangle as AlertIcon, BsPencil as EditIcon, BsSearch as SearchIcon, BsCheckCircle as CheckIcon, BsArrowRepeat as SyncIcon } from 'react-icons/bs';
import { getProducts, createProduct, updateProductStock, deleteProduct, getHsnCodes } from '../api/client.js';
import { useAppStore } from '../store/useAppStore.js';
import ExplainerCallout from '../components/ExplainerCallout.jsx';

export default function Inventory() {
  const { business } = useAppStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals / Dialogs state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // New Product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    hsn_code_id: null,
    hsn_code: '',
    stock_qty: 10,
    min_alert_qty: 5,
    unit_price: 100,
    tax_rate: 18
  });
  
  // Stock adjustment state
  const [adjustStockQty, setAdjustStockQty] = useState('');

  // HSN Search Autocomplete state
  const [hsnOptions, setHsnOptions] = useState([]);
  const [hsnLoading, setHsnLoading] = useState(false);

  // Fetch products
  const fetchInventory = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(business.id);
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // HSN Search
  const searchHSN = useCallback(async (q) => {
    if (!q || q.length < 2) return;
    setHsnLoading(true);
    try {
      const res = await getHsnCodes(q);
      setHsnOptions(res);
    } catch (_) {
    } finally {
      setHsnLoading(false);
    }
  }, []);

  // Handle Add Product Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!business?.id) return;
    setError(null);
    try {
      await createProduct({
        ...newProduct,
        business_id: business.id,
        stock_qty: Number(newProduct.stock_qty),
        min_alert_qty: Number(newProduct.min_alert_qty),
        unit_price: Number(newProduct.unit_price),
        tax_rate: Number(newProduct.tax_rate)
      });
      setAddDialogOpen(false);
      // Reset form
      setNewProduct({
        name: '',
        hsn_code_id: null,
        hsn_code: '',
        stock_qty: 10,
        min_alert_qty: 5,
        unit_price: 100,
        tax_rate: 18
      });
      setHsnOptions([]);
      fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to create product');
    }
  };

  // Handle Adjust Stock Submit
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setError(null);
    try {
      await updateProductStock(selectedProduct.id, Number(adjustStockQty));
      setStockDialogOpen(false);
      fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    }
  };

  // Handle Delete Product
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product from your inventory?')) return;
    setError(null);
    try {
      await deleteProduct(id);
      fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  if (!business) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Please select a simulated business scenario before managing inventory.
      </Alert>
    );
  }

  // Calculate overview stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => Number(p.stock_qty) <= Number(p.min_alert_qty)).length;
  const totalValue = products.reduce((sum, p) => sum + (Number(p.stock_qty) * Number(p.unit_price)), 0);
  const avgTaxRate = totalProducts > 0 
    ? (products.reduce((sum, p) => sum + Number(p.tax_rate), 0) / totalProducts).toFixed(1)
    : '0';

  return (
    <Box>
      <ExplainerCallout title="Inventory Management & Stock Control">
        Manage your product catalog, monitor current stock levels, and set low stock alerts.
        Invoices you create will automatically decrement stock for sales, and increment stock for purchases, ensuring your real-time inventory ledger is always accurate.
      </ExplainerCallout>

      {/* Header and Add Action */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <BoxIcon size={30} color="#1a3c6e" />
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' } }}>
            Inventory Management
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={fetchInventory}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlusIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Add Product
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats Summary Widgets */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #1a3c6e', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">TOTAL PRODUCTS</Typography>
              <Typography variant="h5" fontWeight={800} color="#1a3c6e" sx={{ mt: 0.5 }}>{totalProducts}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #d32f2f', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">LOW STOCK ALERTS</Typography>
              <Typography variant="h5" fontWeight={800} color="#d32f2f" sx={{ mt: 0.5 }}>{lowStockCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #2e7d32', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">INVENTORY VALUE</Typography>
              <Typography variant="h5" fontWeight={800} color="#2e7d32" sx={{ mt: 0.5 }}>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #ed6c02', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">AVG TAX RATE</Typography>
              <Typography variant="h5" fontWeight={800} color="#ed6c02" sx={{ mt: 0.5 }}>{avgTaxRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Inventory List */}
      {loading && products.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : products.length === 0 ? (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6, borderRadius: 2 }}>
          <CardContent>
            <BoxIcon size={48} color="#aaa" style={{ marginBottom: 12 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>Your Inventory is empty</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add products to start tracking your stock levels and simplify invoice creation.
            </Typography>
            <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setAddDialogOpen(true)}>
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Product Name</TableCell>
                <TableCell style={{ fontWeight: 700 }}>HSN Code</TableCell>
                <TableCell align="right" style={{ fontWeight: 700 }}>Unit Price</TableCell>
                <TableCell align="right" style={{ fontWeight: 700 }}>Tax Rate</TableCell>
                <TableCell align="right" style={{ fontWeight: 700 }}>Stock Qty</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="center" style={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const isLowStock = Number(product.stock_qty) <= Number(product.min_alert_qty);
                return (
                  <TableRow key={product.id} hover>
                    <TableCell style={{ fontWeight: 600 }}>{product.name}</TableCell>
                    <TableCell>
                      {product.hsn_code ? (
                        <Tooltip title={product.hsn_description || ''}>
                          <Chip label={product.hsn_code} size="small" variant="outlined" />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">₹{Number(product.unit_price).toFixed(2)}</TableCell>
                    <TableCell align="right">{product.tax_rate}%</TableCell>
                    <TableCell align="right" style={{ fontWeight: 700 }}>{product.stock_qty}</TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <Chip
                          icon={<AlertIcon size={12} />}
                          label="Low Stock"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      ) : (
                        <Chip
                          icon={<CheckIcon size={12} />}
                          label="In Stock"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<EditIcon size={12} />}
                          onClick={() => {
                            setSelectedProduct(product);
                            setAdjustStockQty(product.stock_qty.toString());
                            setStockDialogOpen(true);
                          }}
                        >
                          Adjust Qty
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(product.id)}
                        >
                          <TrashIcon size={14} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAddSubmit}>
          <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>Add Product to Inventory</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={hsnOptions}
                  getOptionLabel={(o) => `${o.code} — ${o.description}`}
                  loading={hsnLoading}
                  onInputChange={(_, v) => searchHSN(v)}
                  onChange={(_, v) => {
                    if (v) {
                      setNewProduct({
                        ...newProduct,
                        hsn_code_id: v.id,
                        hsn_code: v.code,
                        tax_rate: v.tax_rate || 18
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="HSN Code (search)"
                      size="small"
                      helperText="Searching HSN automatically sets the associated tax slab rate."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <SearchIcon size={14} color="#999" style={{ marginRight: 6 }} />
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Unit Price (₹)"
                  type="number"
                  value={newProduct.unit_price}
                  onChange={(e) => setNewProduct({ ...newProduct, unit_price: e.target.value })}
                  fullWidth
                  required
                  size="small"
                  inputProps={{ min: "0", step: "0.01" }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  label="Tax Rate"
                  value={newProduct.tax_rate}
                  onChange={(e) => setNewProduct({ ...newProduct, tax_rate: Number(e.target.value) })}
                  fullWidth
                  size="small"
                  SelectProps={{ native: true }}
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Initial Stock Qty"
                  type="number"
                  value={newProduct.stock_qty}
                  onChange={(e) => setNewProduct({ ...newProduct, stock_qty: e.target.value })}
                  fullWidth
                  required
                  size="small"
                  inputProps={{ min: "0" }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Min Alert Qty"
                  type="number"
                  value={newProduct.min_alert_qty}
                  onChange={(e) => setNewProduct({ ...newProduct, min_alert_qty: e.target.value })}
                  fullWidth
                  required
                  size="small"
                  helperText="Warns you when stock falls below this level."
                  inputProps={{ min: "0" }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              Add Product
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleStockSubmit}>
          <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>Adjust Stock Level</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Update stock quantity for <strong>{selectedProduct?.name}</strong>.
            </Typography>
            <TextField
              label="Stock Quantity"
              type="number"
              value={adjustStockQty}
              onChange={(e) => setAdjustStockQty(e.target.value)}
              fullWidth
              required
              autoFocus
              size="small"
              inputProps={{ min: "0" }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setStockDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              Save Quantity
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
