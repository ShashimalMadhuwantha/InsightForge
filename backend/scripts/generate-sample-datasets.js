const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const sampleDir = path.join(__dirname, '..', '..', 'sample-datasets');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// 1. E-Commerce Sales Dataset (CSV)
const salesData = [
  ['order_id', 'order_date', 'customer_name', 'region', 'category', 'product_name', 'quantity', 'unit_price', 'total_revenue', 'discount_pct', 'is_returned'],
  ['ORD-1001', '2026-01-05', 'Acme Corp', 'North America', 'Electronics', 'UltraHD Monitor 32"', '2', '450.00', '900.00', '0.00', 'false'],
  ['ORD-1002', '2026-01-07', 'Nexus Innovations', 'Europe', 'Furniture', 'Ergonomic Mesh Chair', '5', '220.00', '1100.00', '0.10', 'false'],
  ['ORD-1003', '2026-01-12', 'Globex Industrial', 'Asia Pacific', 'Office Supplies', 'Premium Gel Pens (50pk)', '10', '18.50', '185.00', '0.05', 'false'],
  ['ORD-1004', '2026-01-15', 'Wayne Enterprises', 'North America', 'Electronics', 'Wireless Mechanical Keyboard', '4', '135.00', '540.00', '0.15', 'true'],
  ['ORD-1005', '2026-01-18', 'Stark Industries', 'North America', 'Technology', 'Thunderbolt 4 Docking Hub', '3', '280.00', '840.00', '0.00', 'false'],
  ['ORD-1006', '2026-01-22', 'Umbrella Tech', 'Europe', 'Office Supplies', 'Laser Jet Paper (5 reams)', '20', '32.00', '640.00', '0.20', 'false'],
  ['ORD-1007', '2026-01-25', 'Cyberdyne Systems', 'Asia Pacific', 'Electronics', 'Active Noise Canceling Headset', '8', '190.00', '1520.00', '0.10', 'false'],
  ['ORD-1008', '2026-01-28', 'Soylent Health', 'Latin America', 'Furniture', 'Standing Desk Converter', '2', '310.00', '620.00', '0.00', 'false'],
  ['ORD-1009', '2026-02-02', 'Initech Corp', 'North America', 'Technology', 'Smart Conference Speakerphone', '1', '350.00', '350.00', '', 'false'],
  ['ORD-1010', '2026-02-05', 'Hooli Labs', 'North America', 'Office Supplies', 'Heavy Duty Shredder', '3', '145.00', '435.00', '0.05', 'false'],
  ['ORD-1011', '2026-02-10', 'Massive Dynamic', 'Europe', 'Electronics', '4K USB-C Webcam', '6', '120.00', '720.00', '0.10', 'false'],
  ['ORD-1012', '2026-02-14', 'Wonka Logistics', 'Latin America', 'Furniture', 'Executive Leather Highback', '2', '490.00', '980.00', '0.00', 'false'],
  ['ORD-1013', '2026-02-18', 'Pied Piper Inc', 'North America', 'Technology', 'NVMe SSD 2TB External', '15', '160.00', '2400.00', '0.15', 'false'],
  ['ORD-1014', '2026-02-22', 'Dunder Mifflin', 'North America', 'Office Supplies', 'Multipurpose Copy Paper', '50', '28.00', '1400.00', '0.25', 'false'],
  ['ORD-1015', '2026-02-26', 'Aperture Science', 'Asia Pacific', 'Electronics', 'Curved Gaming Monitor 34"', '3', '580.00', '1740.00', '0.05', 'true'],
  ['ORD-1005', '2026-01-18', 'Stark Industries', 'North America', 'Technology', 'Thunderbolt 4 Docking Hub', '3', '280.00', '840.00', '0.00', 'false'], // deliberate duplicate row
];

const salesCsvContent = salesData.map((row) => row.join(',')).join('\n');
fs.writeFileSync(path.join(sampleDir, 'ecommerce_sales_sample.csv'), salesCsvContent, 'utf-8');

// 2. SaaS Customer Retention & Subscriptions (CSV)
const saasData = [
  ['account_id', 'company_name', 'tier_plan', 'monthly_spend_usd', 'seats_purchased', 'signup_date', 'last_active_date', 'support_tickets_count', 'health_score', 'churned'],
  ['ACC-5001', 'Alpha Omega Software', 'Enterprise', '2499.00', '150', '2024-03-15', '2026-09-05', '3', '94', 'false'],
  ['ACC-5002', 'Beta Cloud Solutions', 'Pro', '499.00', '30', '2024-08-20', '2026-09-06', '1', '88', 'false'],
  ['ACC-5003', 'Gamma Retail Tech', 'Starter', '99.00', '5', '2025-01-10', '2026-09-01', '0', '79', 'false'],
  ['ACC-5004', 'Delta AI Labs', 'Enterprise', '4800.00', '320', '2023-11-01', '2026-09-07', '8', '96', 'false'],
  ['ACC-5005', 'Epsilon Analytics', 'Pro', '499.00', '25', '2025-04-12', '2026-08-15', '5', '62', 'false'],
  ['ACC-5006', 'Zeta FinTech Group', 'Enterprise', '3600.00', '200', '2024-06-30', '2026-09-07', '2', '91', 'false'],
  ['ACC-5007', 'Eta Logistics Ltd', 'Starter', '99.00', '4', '2025-09-01', '2026-07-20', '6', '45', 'true'],
  ['ACC-5008', 'Theta Media Network', 'Pro', '799.00', '50', '2024-12-05', '2026-09-04', '4', '85', 'false'],
  ['ACC-5009', 'Iota Healthcare', 'Enterprise', '5200.00', '400', '2023-09-18', '2026-09-07', '1', '98', 'false'],
  ['ACC-5010', 'Kappa Creative Agency', 'Starter', '149.00', '8', '2025-11-20', '2026-09-02', '2', '', 'false'], // deliberate missing health score
];
const saasCsvContent = saasData.map((row) => row.join(',')).join('\n');
fs.writeFileSync(path.join(sampleDir, 'saas_customer_metrics.csv'), saasCsvContent, 'utf-8');

// 3. Factory Plant OEE & Operations Telemetry (Excel .xlsx)
const oeeRows = [
  { plant_id: 'PLANT-01', line_id: 'LINE-A', timestamp: '2026-08-01 08:00', shift: 'Morning', target_units: 1200, actual_units: 1145, reject_units: 12, availability_pct: 95.4, performance_pct: 94.2, quality_pct: 98.9, oee_score: 88.9 },
  { plant_id: 'PLANT-01', line_id: 'LINE-A', timestamp: '2026-08-01 16:00', shift: 'Evening', target_units: 1200, actual_units: 1180, reject_units: 8, availability_pct: 98.1, performance_pct: 97.0, quality_pct: 99.3, oee_score: 94.5 },
  { plant_id: 'PLANT-01', line_id: 'LINE-B', timestamp: '2026-08-01 08:00', shift: 'Morning', target_units: 850, actual_units: 790, reject_units: 24, availability_pct: 91.0, performance_pct: 90.5, quality_pct: 96.9, oee_score: 79.8 },
  { plant_id: 'PLANT-02', line_id: 'LINE-C', timestamp: '2026-08-01 08:00', shift: 'Morning', target_units: 2000, actual_units: 1960, reject_units: 15, availability_pct: 99.0, performance_pct: 98.0, quality_pct: 99.2, oee_score: 96.2 },
  { plant_id: 'PLANT-02', line_id: 'LINE-C', timestamp: '2026-08-01 16:00', shift: 'Evening', target_units: 2000, actual_units: 1850, reject_units: 35, availability_pct: 94.5, performance_pct: 92.5, quality_pct: 98.1, oee_score: 85.7 },
  { plant_id: 'PLANT-03', line_id: 'LINE-D', timestamp: '2026-08-01 08:00', shift: 'Morning', target_units: 1500, actual_units: 1420, reject_units: null, availability_pct: 96.0, performance_pct: 94.6, quality_pct: null, oee_score: 89.2 },
  { plant_id: 'PLANT-03', line_id: 'LINE-D', timestamp: '2026-08-01 16:00', shift: 'Evening', target_units: 1500, actual_units: 1490, reject_units: 10, availability_pct: 98.5, performance_pct: 97.8, quality_pct: 99.3, oee_score: 95.6 },
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(oeeRows);
xlsx.utils.book_append_sheet(wb, ws, 'OEE_Plant_Telemetry');
xlsx.writeFile(wb, path.join(sampleDir, 'factory_production_telemetry.xlsx'));

console.log('Sample datasets generated successfully in:', sampleDir);
