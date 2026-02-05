import { useEffect, useState, useCallback } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import { useSession } from "../../auth/authContext";
import { fetchProviderInvoices, createProviderInvoice, fetchProviderJobs, downloadInvoicePDF } from "../../data/provider";
import "../../styles/provider/providerInvoices.css";

function ProviderInvoices() {
  const toast = useToast();
  const { profile } = useSession();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sortBy, setSortBy] = useState("date-desc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProviderInvoices();
      const normalized = (data || []).map(normalizeInvoice);
      setInvoices(normalized);
      // If no invoices, attempt to generate from completed jobs
      if (!normalized || normalized.length === 0) {
        const jobs = await fetchProviderJobs({ status: "completed" });
        if (jobs?.length) {
          const generated = await Promise.all(
            jobs.map((job) =>
              createProviderInvoice(generateInvoiceFromAppointment(job))
            )
          );
          setInvoices(generated.map(normalizeInvoice));
        }
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast.push({
        title: "Error loading invoices",
        description: error.message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Filter and sort invoices
  useEffect(() => {
    let filtered = invoices;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (inv) =>
          inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.service.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.invoiceDate) - new Date(a.invoiceDate);
        case "date-asc":
          return new Date(a.invoiceDate) - new Date(b.invoiceDate);
        case "amount-desc":
          return b.totalAmount - a.totalAmount;
        case "amount-asc":
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

    setFilteredInvoices(filtered);
  }, [invoices, searchQuery, statusFilter, sortBy]);

  const generateInvoiceFromAppointment = (appointment) => {
    const invoiceDate = new Date(appointment.scheduled_at || appointment.date || Date.now());
    const invoiceNumber = `INV-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    return {
      id: `inv_${appointment.id}`,
      invoiceNumber,
      invoiceDate: invoiceDate.toISOString(),
      appointmentId: appointment.id,
      clientName: appointment.client_name || appointment.clientName,
      clientEmail: appointment.clientEmail || "N/A",
      clientPhone: appointment.phone || "N/A",
      service: appointment.service_name || appointment.service,
      description: `Service provided: ${appointment.service_name || appointment.service}`,
      quantity: 1,
      unitPrice: appointment.price || appointment.total_amount || 0,
      totalAmount: appointment.price || appointment.total_amount || 0,
      depositAmount: appointment.depositAmount || 0,
      finalAmount: (appointment.price || 0) - (appointment.depositAmount || 0),
      status: appointment.status || "paid",
      paymentDate: new Date(appointment.date),
      notes: appointment.notes || "",
      address: appointment.address || "N/A",
    };
  };

  const normalizeInvoice = (inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number || inv.invoiceNumber,
    invoiceDate: inv.issued_at || inv.invoiceDate,
    appointmentId: inv.booking_id || inv.appointmentId,
    clientName: inv.client_name || inv.clientName,
    clientEmail: inv.client_email || inv.clientEmail || "N/A",
    clientPhone: inv.client_phone || inv.clientPhone || "N/A",
    service: inv.service || "Service",
    description: inv.description || "",
    quantity: 1,
    unitPrice: inv.unit_price || inv.unitPrice || inv.total_amount || 0,
    totalAmount: inv.total_amount || inv.totalAmount || 0,
    depositAmount: inv.deposit_amount || inv.depositAmount || 0,
    finalAmount: inv.final_amount || inv.finalAmount || inv.total_amount || 0,
    status: inv.status || "pending",
    paymentDate: inv.paid_at || inv.paymentDate,
    notes: inv.notes || "",
    address: inv.address || "N/A",
  });

  const handleDownloadInvoice = async (invoice) => {
    try {
      await downloadInvoicePDF(invoice.id);
      toast.push({
        title: "Invoice downloaded",
        description: `${invoice.invoiceNumber} has been downloaded as PDF`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.push({
        title: "Download failed",
        description: "Could not download the invoice. Please try again.",
        variant: "error",
      });
    }
  };

  const handlePrintInvoice = (invoice) => {
    const invoiceHTML = generateInvoiceHTML(invoice);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .invoice-container {
            max-width: 900px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 40px;
            background: white;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .invoice-title h1 {
            margin: 0;
            font-size: 28px;
            color: #333;
          }
          .invoice-details {
            text-align: right;
          }
          .invoice-details p {
            margin: 5px 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            color: #555;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .two-column {
            display: flex;
            gap: 40px;
            margin-bottom: 30px;
          }
          .column {
            flex: 1;
          }
          .column p {
            margin: 5px 0;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          td {
            border: 1px solid #ddd;
            padding: 10px;
          }
          .total-row {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .summary {
            float: right;
            width: 300px;
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            margin-bottom: 20px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .summary-item.total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #dff0d8;
            color: #3c763d;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <p><span class="status-badge">${invoice.status.toUpperCase()}</span></p>
            </div>
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p><strong>Service Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="two-column">
            <div class="column">
              <div class="section">
                <div class="section-title">From</div>
                <p><strong>${profile?.name || "Service Provider"}</strong></p>
                <p>${profile?.email || "N/A"}</p>
              </div>
            </div>
            <div class="column">
              <div class="section">
                <div class="section-title">Bill To</div>
                <p><strong>${invoice.clientName}</strong></p>
                <p>${invoice.clientEmail}</p>
                <p>${invoice.clientPhone}</p>
                <p>${invoice.address}</p>
              </div>
            </div>
          </div>

          <div style="clear: both;"></div>

          <div class="summary">
            <div class="summary-item">
              <span>Service Amount:</span>
              <span>$${(invoice.totalAmount / 100).toFixed(2)}</span>
            </div>
            ${
              invoice.depositAmount > 0
                ? `
              <div class="summary-item">
                <span>Deposit Paid:</span>
                <span>$${(invoice.depositAmount / 100).toFixed(2)}</span>
              </div>
              <div class="summary-item">
                <span>Final Payment:</span>
                <span>$${(invoice.finalAmount / 100).toFixed(2)}</span>
              </div>
            `
                : ""
            }
            <div class="summary-item total">
              <span>Total:</span>
              <span>$${(invoice.totalAmount / 100).toFixed(2)}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Details</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoice.description}</td>
                  <td style="text-align: right;">$${(invoice.totalAmount / 100).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td>Total Due:</td>
                  <td style="text-align: right;">$${(invoice.totalAmount / 100).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${
            invoice.notes
              ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <p>${invoice.notes}</p>
            </div>
          `
              : ""
          }

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is an automatically generated invoice from Proxey</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getTotalRevenue = () => {
    return invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const getPaidCount = () => {
    return invoices.filter((inv) => inv.status === "paid").length;
  };

  if (loading) {
    return (
      <div className="provider-invoices">
        <div className="provider-invoices__stats">
          <div>
            <Skeleton height={60} />
          </div>
          <div>
            <Skeleton height={60} />
          </div>
          <div>
            <Skeleton height={60} />
          </div>
        </div>
        <Card>
          <Skeleton height={40} width="60%" />
          <Skeleton height={200} style={{ marginTop: "20px" }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="provider-invoices">
      {/* Stats Cards */}
      <div className="provider-invoices__stats">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">${(getTotalRevenue() / 100).toFixed(2)}</div>
          <div className="stat-subtitle">From {invoices.length} invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Invoices Paid</div>
          <div className="stat-value">{getPaidCount()}</div>
          <div className="stat-subtitle">Out of {invoices.length} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Invoice</div>
          <div className="stat-value">
            ${invoices.length > 0 ? ((getTotalRevenue() / invoices.length) / 100).toFixed(2) : "0.00"}
          </div>
          <div className="stat-subtitle">Invoice value</div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="provider-invoices__controls">
        <div className="controls-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by client, invoice #, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices List */}
      {filteredInvoices.length > 0 ? (
        <div className="provider-invoices__list">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="invoice-card"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="invoice-card__header">
                <div>
                  <h3 className="invoice-card__number">{invoice.invoiceNumber}</h3>
                  <p className="invoice-card__client">{invoice.clientName}</p>
                </div>
                <div className="invoice-card__status">
                  <span className={`status-badge status-${invoice.status}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="invoice-card__details">
                <div className="detail-item">
                  <span className="label">Service:</span>
                  <span className="value">{invoice.service}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Date:</span>
                  <span className="value">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Amount:</span>
                  <span className="value amount">
                    ${(invoice.totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="invoice-card__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadInvoice(invoice);
                  }}
                >
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrintInvoice(invoice);
                  }}
                >
                  Print
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="provider-invoices__empty">
          <h3>No invoices found</h3>
          <p>
            {invoices.length === 0
              ? "You don't have any completed appointments yet. Invoices will appear here once services are completed."
              : "No invoices match your search criteria."}
          </p>
        </Card>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div
          className="invoice-modal-overlay"
          onClick={() => setSelectedInvoice(null)}
        >
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedInvoice.invoiceNumber}</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedInvoice(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="invoice-preview">
                <div className="preview-section">
                  <h3>Invoice Details</h3>
                  <div className="detail-row">
                    <span>Invoice Number:</span>
                    <strong>{selectedInvoice.invoiceNumber}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Invoice Date:</span>
                    <strong>
                      {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span className={`status-badge status-${selectedInvoice.status}`}>
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="preview-section">
                  <h3>Client Information</h3>
                  <div className="detail-row">
                    <span>Name:</span>
                    <strong>{selectedInvoice.clientName}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Email:</span>
                    <span>{selectedInvoice.clientEmail}</span>
                  </div>
                  <div className="detail-row">
                    <span>Phone:</span>
                    <span>{selectedInvoice.clientPhone}</span>
                  </div>
                  <div className="detail-row">
                    <span>Address:</span>
                    <span>{selectedInvoice.address}</span>
                  </div>
                </div>

                <div className="preview-section">
                  <h3>Service Information</h3>
                  <div className="detail-row">
                    <span>Service:</span>
                    <strong>{selectedInvoice.service}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Description:</span>
                    <span>{selectedInvoice.description}</span>
                  </div>
                </div>

                <div className="preview-section">
                  <h3>Payment Details</h3>
                  <div className="detail-row">
                    <span>Service Amount:</span>
                    <span>${(selectedInvoice.totalAmount / 100).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.depositAmount > 0 && (
                    <>
                      <div className="detail-row">
                        <span>Deposit Paid:</span>
                        <span>${(selectedInvoice.depositAmount / 100).toFixed(2)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Final Payment:</span>
                        <span>${(selectedInvoice.finalAmount / 100).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="detail-row total">
                    <span>Total Amount:</span>
                    <strong>${(selectedInvoice.totalAmount / 100).toFixed(2)}</strong>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="preview-section">
                    <h3>Notes</h3>
                    <p>{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={() => handleDownloadInvoice(selectedInvoice)}
              >
                Download PDF
              </Button>
              <Button
                variant="secondary"
                onClick={() => handlePrintInvoice(selectedInvoice)}
              >
                Print
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderInvoices;
