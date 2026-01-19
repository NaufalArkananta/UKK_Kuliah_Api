export const notaHtml = (data: {
  namaStan: string;
  logoUrl?: string;
  orderId: number;
  tanggal: string;
  jam: string;
  items: {
    namaMenu: string;
    harga: number;
    qty: number;
    diskonPersen?: number;
  }[];
}) => {
  const formatRp = (n: number) => "Rp" + n.toLocaleString("id-ID");

const rows = data.items
  .map((item) => {
    const subtotal = item.harga * item.qty;

    return `
      <tr>
        <td>${item.namaMenu}</td>
        <td>${formatRp(item.harga)}</td>
        <td>${item.diskonPersen ? item.diskonPersen + "%" : "-"}</td>
        <td>${item.qty}</td>
        <td>${formatRp(subtotal)}</td>
      </tr>
    `;
  })
  .join("");

const total = data.items.reduce(
  (sum, item) => sum + item.harga * item.qty,
  0
);

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body {
    width: 58mm;
    margin: 10px auto;
    padding: 5px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #000;
    background: white;
    line-height: 1.2;
  }

  .center {
    text-align: center;
  }

  .stan-name {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3px;
    padding-bottom: 3px;
    border-bottom: 1px dashed #ccc;
  }

  .info-label {
    font-weight: bold;
    min-width: 40px;
  }

  .info-value {
    flex: 1;
    text-align: right;
  }

  .separator {
    text-align: center;
    margin: 5px 0;
    font-weight: bold;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    padding: 3px 0;
    background: #f5f5f5;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 3px 0;
    font-size: 11px;
  }

  thead th {
    border-bottom: 2px solid #000;
    padding: 3px 2px;
    text-align: left;
    font-weight: bold;
    white-space: nowrap;
  }

  tbody td {
    padding: 3px 2px;
    border-bottom: 1px dotted #ccc;
    vertical-align: top;
  }

  .col-menu {
    width: 40%;
    max-width: 40%;
    word-wrap: break-word;
  }

  .col-number {
    width: 12%;
    text-align: right;
    white-space: nowrap;
  }

  .col-qty {
    width: 8%;
    text-align: center;
    white-space: nowrap;
  }

  .total-section {
    margin-top: 8px;
    padding-top: 5px;
    border-top: 2px solid #000;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 2px 0;
  }

  .total-label {
    font-size: 14px;
    font-weight: bold;
  }

  .total-value {
    font-size: 16px;
    font-weight: bold;
    text-align: right;
  }

  .footer {
    margin-top: 10px;
    padding-top: 5px;
    border-top: 1px dashed #000;
    text-align: center;
    font-size: 10px;
  }

  .footer-text {
    font-weight: bold;
    margin: 3px 0;
  }

  /* Untuk memastikan tidak ada pemutusan garis yang aneh */
  .no-wrap {
    white-space: nowrap;
  }

  /* Style untuk diskon */
  .diskon-cell {
    color: #d32f2f;
    font-weight: bold;
  }

  /* Responsif untuk thermal printer */
  @media print {
    body {
      padding: 2px;
      font-size: 11px;
    }
    
    table {
      font-size: 10px;
    }
    
    .stan-name {
      font-size: 13px;
    }
    
    .total-value {
      font-size: 15px;
    }
    
    /* Hindari pemutusan halaman */
    .avoid-break {
      page-break-inside: avoid;
    }
  }
</style>
</head>

<body>
  <div class="center">
    <div class="stan-name">${data.namaStan}</div>
  </div>

  <div class="info-row">
    <div class="info-label">ID:</div>
    <div class="info-value">#${data.orderId}</div>
  </div>
  
  <div class="info-row">
    <div class="info-label">Tanggal:</div>
    <div class="info-value">${data.tanggal}</div>
  </div>
  
  <div class="info-row">
    <div class="info-label">Jam:</div>
    <div class="info-value">${data.jam}</div>
  </div>

  <div class="separator">DETAIL PESANAN</div>

  <table class="avoid-break">
    <thead>
      <tr>
        <th class="col-menu">Menu</th>
        <th class="col-number">Harga</th>
        <th class="col-number">Diskon</th>
        <th class="col-qty">Qty</th>
        <th class="col-number">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="total-section avoid-break">
    <div class="total-row">
      <div class="total-label">TOTAL</div>
      <div class="total-value">${formatRp(total)}</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">TERIMA KASIH</div>
    <div>Atas kunjungan Anda</div>
    <div class="no-wrap">${new Date().getFullYear()} © ${data.namaStan}</div>
  </div>
</body>
</html>
`;
};
