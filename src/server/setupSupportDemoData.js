import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';
import Customer from './models/customer.js';
import SupportTicket from './models/supportTicket.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Helper to parse dates like DD/MM/YYYY to Date
function parseDMY(dateStr) {
  const [dd, mm, yyyy] = dateStr.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

// Static dataset provided (without ticketId)
// Only first few entries shown here for brevity; rest of dataset continues.
const ticketData = [
  { subject: 'Backup restore failed', status: 'open', createdAt: '08/03/2024', name: 'Navy', email: 'helpdesk@navy.com' },
  { subject: 'Email delivery failure', status: 'open', createdAt: '30/12/2023', name: 'Siemens', email: 'support@siemens.com' },
  { subject: 'Security patch installation', status: 'closed', createdAt: '09/11/2024', name: 'Stripe', email: 'info@stripe.com' },
  { subject: '5G network problem', status: 'closed', createdAt: '11/10/2025', name: 'Tesla', email: 'helpdesk@tesla.com' },
  { subject: 'Payment declined', status: 'open', createdAt: '24/04/2023', name: 'Lenovo', email: 'tech@lenovo.com' },
  { subject: 'System integration issues', status: 'open', createdAt: '03/07/2025', name: 'Amazon', email: 'helpdesk@amazon.com' },
  { subject: 'System monitoring alerts', status: 'open', createdAt: '08/01/2025', name: 'Philips', email: 'helpdesk@philips.com' },
  { subject: 'Printer not connecting', status: 'closed', createdAt: '01/10/2025', name: 'Accenture', email: 'helpdesk@accenture.com' },
  { subject: 'VPN authentication failure', status: 'open', createdAt: '13/10/2024', name: 'Microsoft', email: 'tech@microsoft.com' },
  { subject: 'Cloud function timeout', status: 'closed', createdAt: '10/12/2024', name: 'Twitter', email: 'helpdesk@twitter.com' },
  { subject: 'System monitoring alerts', status: 'open', createdAt: '16/12/2025', name: 'Airbnb', email: 'support@airbnb.com' },
  { subject: 'Security patch installation', status: 'closed', createdAt: '08/06/2025', name: 'Siemens', email: 'support@siemens.com' },
  { subject: 'Security patch installation', status: 'open', createdAt: '10/02/2025', name: 'Hitachi', email: 'tech@hitachi.com' },
  { subject: 'DNS propagation delay', status: 'open', createdAt: '07/04/2024', name: 'Lenovo', email: 'info@lenovo.com' },
  { subject: 'Load balancer error', status: 'closed', createdAt: '22/09/2024', name: 'Etihad', email: 'info@etihad.com' },
  { subject: 'Printer not connecting', status: 'open', createdAt: '26/02/2025', name: 'Samsung', email: 'helpdesk@samsung.com' },
  { subject: 'Payment gateway timeout issue', status: 'closed', createdAt: '02/05/2025', name: 'GE Healthcare', email: 'info@gehealthcare.com' },
  { subject: 'DNS propagation delay', status: 'closed', createdAt: '27/01/2024', name: 'Hitachi', email: 'support@hitachi.com' },
  { subject: 'SSL certificate renewal reminder', status: 'closed', createdAt: '24/11/2023', name: 'Google', email: 'support@google.com' },
  { subject: 'Repository access issue', status: 'closed', createdAt: '19/03/2025', name: 'Norton', email: 'info@norton.com' },
  { subject: 'Cloud storage latency', status: 'closed', createdAt: '14/02/2025', name: 'HSBC', email: 'support@hsbc.com' },
  { subject: 'Database replication lag observed', status: 'open', createdAt: '11/10/2024', name: 'BMW', email: 'helpdesk@bmw.com' },
  { subject: 'Cloud storage latency', status: 'closed', createdAt: '03/07/2023', name: 'LG', email: 'support@lg.com' },
  { subject: 'ETL job failed', status: 'closed', createdAt: '27/10/2025', name: 'Zoom', email: 'support@zoom.com' },
  { subject: 'AI Chatbot configuration assistance', status: 'open', createdAt: '06/01/2024', name: 'Bosch', email: 'support@bosch.com' },
  { subject: 'Video buffering', status: 'closed', createdAt: '20/07/2025', name: 'Dropbox', email: 'support@dropbox.com' },
  { subject: 'Backup restore failed', status: 'open', createdAt: '23/07/2024', name: 'Siemens', email: 'info@siemens.com' },
  { subject: 'Mobile app crash report', status: 'open', createdAt: '12/04/2024', name: 'TikTok', email: 'support@tiktok.com' },
  { subject: 'Hosting downtime issue', status: 'open', createdAt: '12/09/2023', name: 'General Motors', email: 'helpdesk@generalmotors.com' },
  { subject: 'Load testing error', status: 'closed', createdAt: '26/09/2025', name: 'FedEx', email: 'tech@fedex.com' },
  { subject: 'Storage quota exceeded', status: 'closed', createdAt: '14/10/2025', name: 'Shell', email: 'helpdesk@shell.com' },
  { subject: 'Delay in SMS notifications', status: 'open', createdAt: '04/01/2025', name: '3M', email: 'support@3m.com' },
  { subject: 'Cloud function timeout', status: 'open', createdAt: '26/12/2024', name: 'Qatar Airways', email: 'support@qatarairways.com' },
  { subject: 'Cloud function timeout', status: 'closed', createdAt: '05/01/2024', name: 'Qatar Airways', email: 'tech@qatarairways.com' },
  { subject: 'DNS propagation delay', status: 'closed', createdAt: '02/08/2023', name: 'Microsoft', email: 'tech@microsoft.com' },
  { subject: 'Firewall rules misconfiguration', status: 'closed', createdAt: '21/03/2025', name: 'Malaysia Airlines', email: 'tech@malaysiaairlines.com' },
  { subject: 'Cloud function timeout', status: 'closed', createdAt: '06/12/2023', name: 'El-Swedy', email: 'tech@el-swedy.com' },
  { subject: 'ETL job failed', status: 'open', createdAt: '25/09/2025', name: 'Pepsi', email: 'helpdesk@pepsi.com' },
  { subject: 'System integration issues', status: 'closed', createdAt: '18/11/2025', name: 'ByteDance', email: 'tech@bytedance.com' },
  { subject: 'DNS propagation delay', status: 'closed', createdAt: '01/10/2025', name: 'Siemens', email: 'tech@siemens.com' },
  { subject: 'API rate limiting errors', status: 'open', createdAt: '15/05/2024', name: 'Adidas', email: 'tech@adidas.com' },
  { subject: 'Two-factor authentication setup', status: 'closed', createdAt: '28/02/2025', name: 'Salesforce', email: 'support@salesforce.com' },
  { subject: 'Data export failure', status: 'open', createdAt: '19/08/2024', name: 'Netflix', email: 'helpdesk@netflix.com' },
  { subject: 'Invalid certificate authority', status: 'closed', createdAt: '30/04/2025', name: 'Sony', email: 'support@sony.com' },
  { subject: 'Mobile app crash report', status: 'closed', createdAt: '11/07/2023', name: 'Dell', email: 'tech@dell.com' },
  { subject: 'Server hardware maintenance', status: 'closed', createdAt: '22/11/2024', name: 'Cisco', email: 'support@cisco.com' },
  { subject: 'Video conferencing audio issues', status: 'open', createdAt: '05/03/2025', name: 'Spotify', email: 'helpdesk@spotify.com' },
  { subject: 'Cache invalidation problem', status: 'open', createdAt: '14/06/2024', name: 'Intel', email: 'info@intel.com' },
  { subject: 'Ransomware prevention query', status: 'closed', createdAt: '09/12/2023', name: 'Walmart', email: 'security@walmart.com' },
  { subject: 'Invalid certificate authority', status: 'open', createdAt: '17/01/2025', name: 'Adobe', email: 'support@adobe.com' },
  { subject: 'CDN configuration assistance', status: 'closed', createdAt: '03/09/2024', name: 'Nike', email: 'tech@nike.com' },
  { subject: 'Payment declined', status: 'closed', createdAt: '25/05/2023', name: 'Oracle', email: 'billing@oracle.com' },
  { subject: 'Load testing error', status: 'open', createdAt: '08/10/2025', name: 'JPMorgan Chase', email: 'helpdesk@jpmorganchase.com' },
  { subject: 'Invalid certificate authority', status: 'closed', createdAt: '12/08/2025', name: 'Hyundai', email: 'support@hyundai.com' },
  { subject: 'Firewall rules misconfiguration', status: 'open', createdAt: '29/07/2024', name: 'Airbus', email: 'tech@airbus.com' },
  { subject: 'Repository access issue', status: 'open', createdAt: '16/04/2025', name: 'Verizon', email: 'helpdesk@verizon.com' },
  { subject: 'Database replication lag observed', status: 'closed', createdAt: '21/12/2023', name: 'Toyota', email: 'support@toyota.com' },
  { subject: '5G network problem', status: 'open', createdAt: '07/02/2024', name: 'Honda', email: 'tech@honda.com' },
  { subject: 'Cache invalidation problem', status: 'closed', createdAt: '10/11/2025', name: 'Mastercard', email: 'support@mastercard.com' },
  { subject: 'Two-factor authentication setup', status: 'open', createdAt: '24/08/2023', name: 'BP', email: 'helpdesk@bp.com' },
  { subject: 'Video conferencing audio issues', status: 'closed', createdAt: '01/06/2024', name: 'Visa', email: 'tech@visa.com' },
  { subject: 'Ransomware prevention query', status: 'open', createdAt: '13/05/2025', name: 'Comcast', email: 'security@comcast.com' },
  { subject: 'CDN configuration assistance', status: 'open', createdAt: '27/03/2024', name: 'Disney', email: 'helpdesk@disney.com' },
  { subject: 'Server hardware maintenance', status: 'open', createdAt: '04/09/2023', name: 'AT&T', email: 'support@att.com' },
  { subject: 'Data export failure', status: 'closed', createdAt: '20/01/2024', name: 'IBM', email: 'helpdesk@ibm.com' },
  { subject: 'Payment gateway timeout issue', status: 'open', createdAt: '15/07/2025', name: 'Samsung', email: 'billing@samsung.com' },
  { subject: 'Cache invalidation problem', status: 'closed', createdAt: '06/04/2024', name: 'Costco', email: 'tech@costco.com' },
  { subject: 'Video conferencing audio issues', status: 'open', createdAt: '23/10/2023', name: 'Mercedes-Benz', email: 'helpdesk@mercedes-benz.com' },
  { subject: 'CDN configuration assistance', status: 'closed', createdAt: '18/02/2024', name: 'Target', email: 'support@target.com' },
  { subject: 'Server hardware maintenance', status: 'closed', createdAt: '09/05/2025', name: 'PayPal', email: 'tech@paypal.com' },
  { subject: 'Invalid certificate authority', status: 'open', createdAt: '30/06/2024', name: 'Starbucks', email: 'helpdesk@starbucks.com' },
  { subject: 'Data export failure', status: 'open', createdAt: '12/12/2025', name: 'BMW', email: 'support@bmw.com' },
  { subject: 'Ransomware prevention query', status: 'closed', createdAt: '07/08/2023', name: 'Nestlé', email: 'security@nestle.com' },
  { subject: 'Two-factor authentication setup', status: 'open', createdAt: '14/10/2024', name: 'Sony', email: 'helpdesk@sony.com' },
  { subject: 'Payment declined', status: 'closed', createdAt: '26/11/2025', name: 'Home Depot', email: 'billing@homedepot.com' },
  { subject: 'Load testing error', status: 'closed', createdAt: '03/01/2024', name: 'Volkswagen', email: 'tech@volkswagen.com' },
  { subject: 'API rate limiting errors', status: 'open', createdAt: '19/09/2025', name: 'Bank of America', email: 'helpdesk@bankofamerica.com' },
  { subject: 'Firewall rules misconfiguration', status: 'closed', createdAt: '22/04/2024', name: 'McDonald\'s', email: 'tech@mcdonalds.com' },
  { subject: 'Repository access issue', status: 'open', createdAt: '05/07/2023', name: 'Citigroup', email: 'support@citigroup.com' },
  { subject: 'Database replication lag observed', status: 'open', createdAt: '11/03/2025', name: 'Philips', email: 'helpdesk@philips.com' },
  { subject: '5G network problem', status: 'closed', createdAt: '28/05/2024', name: 'Unilever', email: 'tech@unilever.com' },
  { subject: 'Cache invalidation problem', status: 'open', createdAt: '16/08/2025', name: 'Lowe\'s', email: 'helpdesk@lowes.com' },
  { subject: 'Video conferencing audio issues', status: 'closed', createdAt: '09/10/2023', name: 'Sony', email: 'support@sony.com' },
  { subject: 'CDN configuration assistance', status: 'open', createdAt: '24/02/2025', name: 'Dell', email: 'tech@dell.com' },
  { subject: 'Server hardware maintenance', status: 'open', createdAt: '07/12/2024', name: 'Ford', email: 'helpdesk@ford.com' },
  { subject: 'Data export failure', status: 'closed', createdAt: '13/06/2023', name: 'HP', email: 'support@hp.com' },
  { subject: 'Invalid certificate authority', status: 'closed', createdAt: '20/09/2024', name: 'Sprint', email: 'tech@sprint.com' },
  { subject: 'Ransomware prevention query', status: 'open', createdAt: '01/04/2025', name: 'Caterpillar', email: 'security@caterpillar.com' },
  { subject: 'Two-factor authentication setup', status: 'closed', createdAt: '17/11/2023', name: 'Morgan Stanley', email: 'support@morganstanley.com' },
  { subject: 'Payment declined', status: 'open', createdAt: '08/05/2024', name: 'Canon', email: 'billing@canon.com' },
  { subject: 'Load testing error', status: 'open', createdAt: '25/01/2025', name: 'Pfizer', email: 'tech@pfizer.com' },
  { subject: 'API rate limiting errors', status: 'closed', createdAt: '30/03/2024', name: 'Nissan', email: 'helpdesk@nissan.com' },
  { subject: 'Firewall rules misconfiguration', status: 'open', createdAt: '12/07/2025', name: 'IKEA', email: 'tech@ikea.com' },
  { subject: 'Repository access issue', status: 'closed', createdAt: '04/10/2024', name: 'Prudential', email: 'support@prudential.com' },
  { subject: 'Payment gateway timeout issue', status: 'closed', createdAt: '19/06/2025', name: 'Siemens Health', email: 'helpdesk@siemenshealth.com' },
  { subject: '5G network problem', status: 'open', createdAt: '18/05/2025', name: 'ProcterGamble', email: 'helpdesk@proctergamble.com' },
  { subject: 'Ransomware prevention query', status: 'open', createdAt: '11/11/2025', name: 'Malaysia Airlines', email: 'helpdesk@malaysiaairlines.com' },
  { subject: 'System monitoring alerts', status: 'closed', createdAt: '13/09/2025', name: 'Unilever', email: 'info@unilever.com' },
  { subject: 'Cloud storage latency', status: 'closed', createdAt: '09/07/2023', name: 'Uber', email: 'info@uber.com' },
  { subject: 'Cloud function timeout', status: 'open', createdAt: '11/10/2023', name: 'Accenture', email: 'helpdesk@accenture.com' },
  { subject: 'Database replication lag observed', status: 'closed', createdAt: '15/08/2024', name: 'Barclays', email: 'support@barclays.com' },
  { subject: 'Email delivery failure', status: 'open', createdAt: '22/05/2023', name: 'Allianz', email: 'helpdesk@allianz.com' },
  { subject: 'SSL certificate renewal reminder', status: 'open', createdAt: '09/04/2025', name: 'AXA', email: 'security@axa.com' },
  { subject: 'System integration issues', status: 'closed', createdAt: '27/07/2023', name: 'Tesco', email: 'tech@tesco.com' },
  { subject: 'VPN authentication failure', status: 'closed', createdAt: '03/02/2024', name: 'Credit Suisse', email: 'support@creditsuisse.com' },
  { subject: 'Mobile app crash report', status: 'open', createdAt: '18/12/2024', name: 'Santander', email: 'helpdesk@santander.com' },
  { subject: 'Backup restore failed', status: 'closed', createdAt: '26/10/2023', name: 'Lloyds Banking Group', email: 'support@lloyds.com' },
  { subject: 'Load balancer error', status: 'open', createdAt: '14/01/2025', name: 'Telefónica', email: 'tech@telefonica.com' },
  { subject: 'Storage quota exceeded', status: 'open', createdAt: '05/09/2024', name: 'Orange', email: 'helpdesk@orange.com' },
  { subject: 'Delay in SMS notifications', status: 'closed', createdAt: '29/06/2025', name: 'Deutsche Bank', email: 'support@deutschebank.com' },
  { subject: 'ETL job failed', status: 'open', createdAt: '11/03/2023', name: 'Vodafone', email: 'tech@vodafone.com' },
  { subject: 'Hosting downtime issue', status: 'closed', createdAt: '23/08/2025', name: 'ING Group', email: 'helpdesk@ing.com' },
  { subject: 'AI Chatbot configuration assistance', status: 'closed', createdAt: '07/05/2023', name: 'BBVA', email: 'support@bbva.com' },
  { subject: 'Video buffering', status: 'open', createdAt: '20/11/2024', name: 'Société Générale', email: 'helpdesk@socgen.com' },
  { subject: 'Printer not connecting', status: 'closed', createdAt: '02/12/2023', name: 'Standard Chartered', email: 'tech@standardchartered.com' },
  { subject: 'Security patch installation', status: 'open', createdAt: '16/07/2024', name: 'BNP Paribas', email: 'security@bnpparibas.com' },
  { subject: 'DNS propagation delay', status: 'closed', createdAt: '10/10/2023', name: 'Airbus', email: 'tech@airbus.com' },
  { subject: 'Cloud function timeout', status: 'open', createdAt: '25/04/2025', name: 'Thyssenkrupp', email: 'helpdesk@thyssenkrupp.com' },
  { subject: 'System monitoring alerts', status: 'closed', createdAt: '08/02/2023', name: 'Bayer', email: 'support@bayer.com' },
  { subject: 'Payment gateway timeout issue', status: 'open', createdAt: '19/09/2023', name: 'BASF', email: 'billing@basf.com' },
  { subject: 'Firewall rules misconfiguration', status: 'closed', createdAt: '01/07/2025', name: 'Siemens', email: 'tech@siemens.com' },
  { subject: 'Repository access issue', status: 'open', createdAt: '13/11/2023', name: 'Daimler Truck', email: 'support@daimlertruck.com' },
  { subject: 'Cloud storage latency', status: 'open', createdAt: '28/01/2024', name: 'Henkel', email: 'helpdesk@henkel.com' },
  { subject: 'API rate limiting errors', status: 'closed', createdAt: '04/08/2025', name: 'Deutsche Telekom', email: 'tech@telekom.com' },
  { subject: 'Data export failure', status: 'open', createdAt: '17/06/2024', name: 'Zurich Insurance', email: 'support@zurich.com' },
  { subject: 'Invalid certificate authority', status: 'closed', createdAt: '22/12/2025', name: 'Munich Re', email: 'security@munichre.com' },
  { subject: 'Two-factor authentication setup', status: 'open', createdAt: '09/03/2023', name: 'Allianz', email: 'helpdesk@allianz.com' },
  { subject: 'Cache invalidation problem', status: 'closed', createdAt: '15/10/2024', name: 'AXA', email: 'tech@axa.com' },
  { subject: 'Video conferencing audio issues', status: 'open', createdAt: '06/05/2025', name: 'Generali', email: 'support@generali.com' },
  { subject: 'CDN configuration assistance', status: 'closed', createdAt: '24/09/2023', name: 'Legal & General', email: 'tech@legalandgeneral.com' },
  { subject: 'Server hardware maintenance', status: 'open', createdAt: '11/02/2024', name: 'Aviva', email: 'helpdesk@aviva.com' },
  { subject: 'Ransomware prevention query', status: 'closed', createdAt: '30/07/2025', name: 'Prudential', email: 'security@prudential.com' },
  { subject: 'Payment declined', status: 'open', createdAt: '12/04/2023', name: 'AIG', email: 'billing@aig.com' },
  { subject: 'Load testing error', status: 'closed', createdAt: '27/11/2024', name: 'Manulife', email: 'tech@manulife.com' },
  { subject: '5G network problem', status: 'open', createdAt: '03/08/2024', name: 'Sun Life Financial', email: 'helpdesk@sunlife.com' },
  { subject: 'Database replication lag observed', status: 'closed', createdAt: '19/01/2025', name: 'Intact Financial', email: 'support@intactfinancial.com' },
  { subject: 'Email delivery failure', status: 'open', createdAt: '08/06/2023', name: 'Great-West Lifeco', email: 'helpdesk@gwl.com' },
  { subject: 'SSL certificate renewal reminder', status: 'closed', createdAt: '21/10/2025', name: 'Power Corporation', email: 'security@powercorp.com' },
  { subject: 'System integration issues', status: 'open', createdAt: '14/03/2024', name: 'Fairfax Financial', email: 'tech@fairfaxfinancial.com' },
  { subject: 'VPN authentication failure', status: 'closed', createdAt: '05/12/2023', name: 'Brookfield Asset Management', email: 'support@brookfield.com' },
  { subject: 'Mobile app crash report', status: 'open', createdAt: '26/05/2024', name: 'Alimentation Couche-Tard', email: 'helpdesk@couche-tard.com' },
  { subject: 'Backup restore failed', status: 'closed', createdAt: '10/09/2025', name: 'George Weston Limited', email: 'support@weston.com' },
  { subject: 'Load balancer error', status: 'open', createdAt: '17/07/2023', name: 'Magna International', email: 'tech@magna.com' },
  { subject: 'Storage quota exceeded', status: 'closed', createdAt: '29/04/2024', name: 'Thomson Reuters', email: 'helpdesk@thomsonreuters.com' },
  { subject: 'Delay in SMS notifications', status: 'open', createdAt: '02/11/2025', name: 'Canadian Tire', email: 'support@canadiantire.com' },
  { subject: 'ETL job failed', status: 'closed', createdAt: '23/02/2023', name: 'Nutrien', email: 'tech@nutrien.com' },
  { subject: 'Hosting downtime issue', status: 'open', createdAt: '16/08/2024', name: 'TC Energy', email: 'helpdesk@tcenergy.com' },
  { subject: 'AI Chatbot configuration assistance', status: 'closed', createdAt: '07/01/2025', name: 'Enbridge', email: 'support@enbridge.com' },
  { subject: 'Video buffering', status: 'open', createdAt: '20/06/2023', name: 'CN Railway', email: 'helpdesk@cn.ca' },
  { subject: 'Printer not connecting', status: 'closed', createdAt: '11/12/2024', name: 'Bombardier Inc.', email: 'tech@bombardier.com' },
  { subject: 'Security patch installation', status: 'open', createdAt: '25/03/2025', name: 'CGI Inc.', email: 'security@cgi.com' },
  { subject: 'DNS propagation delay', status: 'closed', createdAt: '18/10/2023', name: 'Rogers Communications', email: 'tech@rogers.com' },
  { subject: 'Cloud function timeout', status: 'open', createdAt: '04/07/2024', name: 'BCE Inc.', email: 'helpdesk@bce.ca' },
  { subject: 'System monitoring alerts', status: 'closed', createdAt: '13/05/2023', name: 'Telus Corporation', email: 'support@telus.com' },
  { subject: 'Payment gateway timeout issue', status: 'open', createdAt: '28/09/2024', name: 'Shaw Communications', email: 'billing@shaw.ca' },
  { subject: 'Firewall rules misconfiguration', status: 'closed', createdAt: '09/02/2025', name: 'Loblaw Companies', email: 'tech@loblaw.ca' },
  { subject: 'Repository access issue', status: 'open', createdAt: '22/11/2023', name: 'Metro Inc.', email: 'support@metro.ca' },
  { subject: 'Cloud storage latency', status: 'open', createdAt: '15/04/2024', name: 'Power Financial', email: 'helpdesk@powerfinancial.com' },
  { subject: 'API rate limiting errors', status: 'closed', createdAt: '06/08/2023', name: 'Onex Corporation', email: 'tech@onex.com' },
  { subject: 'Data export failure', status: 'open', createdAt: '19/01/2024', name: 'OpenText', email: 'support@opentext.com' },
  { subject: 'Invalid certificate authority', status: 'closed', createdAt: '30/05/2025', name: 'Constellation Software', email: 'security@csisoftware.com' },
  { subject: 'Two-factor authentication setup', status: 'open', createdAt: '12/07/2023', name: 'WSP Global', email: 'helpdesk@wsp.com' },
  { subject: 'Cache invalidation problem', status: 'closed', createdAt: '27/04/2024', name: 'Gildan', email: 'tech@gildan.com' },
  { subject: 'Video conferencing audio issues', status: 'open', createdAt: '08/10/2025', name: 'Linamar', email: 'support@linamar.com' },
  { subject: 'CDN configuration assistance', status: 'closed', createdAt: '21/03/2023', name: 'CCL Industries', email: 'tech@cclindustries.com' },
  { subject: 'Server hardware maintenance', status: 'open', createdAt: '14/12/2024', name: 'Dollarama', email: 'helpdesk@dollarama.com' },
  { subject: 'Ransomware prevention query', status: 'closed', createdAt: '03/06/2023', name: 'Parkland Corporation', email: 'security@parkland.ca' },
  { subject: 'Payment declined', status: 'open', createdAt: '26/08/2025', name: 'First Quantum Minerals', email: 'billing@fqml.com' },
  { subject: 'Load testing error', status: 'closed', createdAt: '11/01/2024', name: 'Agnico Eagle Mines', email: 'tech@agnicoeagle.com' },
  { subject: '5G network problem', status: 'open', createdAt: '17/05/2025', name: 'Barrick Gold', email: 'helpdesk@barrick.com' },
  { subject: 'Database replication lag observed', status: 'closed', createdAt: '29/09/2023', name: 'Franco-Nevada', email: 'support@franco-nevada.com' },
  { subject: 'Email delivery failure', status: 'open', createdAt: '05/11/2024', name: 'Wheaton Precious Metals', email: 'helpdesk@wheatonpm.com' },
  { subject: 'SSL certificate renewal reminder', status: 'closed', createdAt: '24/02/2024', name: 'Kirkland Lake Gold', email: 'security@kirklandlakegold.com' },
  { subject: 'System integration issues', status: 'open', createdAt: '13/07/2025', name: 'Newmont Corporation', email: 'tech@newmont.com' },
  { subject: 'VPN authentication failure', status: 'closed', createdAt: '07/04/2023', name: 'Kinross Gold', email: 'support@kinross.com' },
  { subject: 'Mobile app crash report', status: 'open', createdAt: '20/10/2024', name: 'Yamana Gold', email: 'helpdesk@yamana.com' },
  { subject: 'Backup restore failed', status: 'closed', createdAt: '16/03/2025', name: 'Eldorado Gold', email: 'support@eldoradogold.com' },
  { subject: 'Load balancer error', status: 'open', createdAt: '09/08/2023', name: 'IAMGOLD', email: 'tech@iamgold.com' },
  { subject: 'Storage quota exceeded', status: 'closed', createdAt: '22/12/2024', name: 'Pan American Silver', email: 'helpdesk@panamericansilver.com' },
  { subject: 'Delay in SMS notifications', status: 'open', createdAt: '01/05/2023', name: 'B2Gold', email: 'support@b2gold.com' },
  { subject: 'ETL job failed', status: 'closed', createdAt: '18/06/2025', name: 'Centerra Gold', email: 'tech@centerragold.com' },
  { subject: 'Hosting downtime issue', status: 'open', createdAt: '27/01/2024', name: 'Alamos Gold', email: 'helpdesk@alamosgold.com' },
  { subject: 'AI Chatbot configuration assistance', status: 'closed', createdAt: '10/09/2023', name: 'Dundee Precious Metals', email: 'support@dundeeprecious.com' },
  { subject: 'Video buffering', status: 'open', createdAt: '15/11/2025', name: 'Equinox Gold', email: 'helpdesk@equinoxgold.com' },
  { subject: 'Printer not connecting', status: 'closed', createdAt: '04/07/2024', name: 'Argonaut Gold', email: 'tech@argonautgold.com' },
  { subject: 'Security patch installation', status: 'open', createdAt: '28/02/2023', name: 'Pretium Resources', email: 'security@pretium.com' },
  { subject: 'DNS propagation delay', status: 'closed', createdAt: '19/04/2025', name: 'Seabridge Gold', email: 'tech@seabridgegold.com' },
  { subject: 'Cloud function timeout', status: 'open', createdAt: '12/10/2023', name: 'Teranga Gold', email: 'helpdesk@terangagold.com' },
  { subject: 'System monitoring alerts', status: 'closed', createdAt: '06/01/2024', name: 'Torex Gold Resources', email: 'support@torexgold.com' },
  { subject: 'Payment gateway timeout issue', status: 'open', createdAt: '25/03/2025', name: 'Victoria Gold', email: 'billing@victoriagold.com' },
  { subject: 'Firewall rules misconfiguration', status: 'closed', createdAt: '17/08/2024', name: 'Marathon Gold', email: 'tech@marathongold.com' },
  { subject: 'Repository access issue', status: 'open', createdAt: '09/05/2023', name: 'Pure Gold Mining', email: 'support@puregoldmining.ca' },
  { subject: 'Cloud storage latency', status: 'open', createdAt: '21/12/2025', name: 'Ascot Resources', email: 'helpdesk@ascotgold.com' },
  { subject: 'API rate limiting errors', status: 'closed', createdAt: '03/11/2024', name: 'Artemis Gold Inc.', email: 'tech@artemisgoldinc.com' },
  { subject: 'Data export failure', status: 'open', createdAt: '14/06/2023', name: 'NovaGold Resources', email: 'support@novagold.com' },
  { subject: 'Invalid certificate authority', status: 'closed', createdAt: '26/09/2024', name: 'Galiano Gold', email: 'security@galianogold.com' },
  { subject: 'Two-factor authentication setup', status: 'open', createdAt: '08/04/2025', name: 'Orla Mining Ltd.', email: 'helpdesk@orlamining.com' },
  { subject: 'Cache invalidation problem', status: 'closed', createdAt: '30/07/2023', name: 'MAG Silver Corp.', email: 'tech@magsilver.com' },
  { subject: 'Video conferencing audio issues', status: 'open', createdAt: '11/02/2024', name: 'SilverCrest Metals', email: 'support@silvercrestmetals.com' },
  { subject: 'CDN configuration assistance', status: 'closed', createdAt: '23/05/2025', name: 'Discovery Metals Corp.', email: 'tech@discoverymetals.com' }
];

async function setupDemoData() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clean up malformed customers
  await Customer.deleteMany({ email: null });

  let inserted = 0, skipped = 0;

  for (const row of ticketData) {
    try {
      // Normalize status to allowed enum values
      let status = row.status === 'in_progress' ? 'in_progress' : (row.status === 'closed' ? 'closed' : 'open');
      const createdDate = parseDMY(row.createdAt);

      // Find or create User
      let user = await User.findOne({ email: row.email });
      if (!user) {
        user = await User.create({ name: row.name, email: row.email, password: 'demo123', role: 'customer' });
      }

      // Find or create Customer
      let customer = await Customer.findOne({ companyName: row.name });
      if (!customer) {
        customer = await Customer.create({ userId: user._id, companyName: row.name, contactPerson: row.name });
      }

      // Check duplicate (same customer, issue, status, same day)
      const dayStart = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      const dayEnd = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() + 1);
      const duplicate = await SupportTicket.findOne({
        customerId: customer._id,
        issue: row.subject,
        status,
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      if (duplicate) {
        skipped++;
        continue;
      }

      await SupportTicket.create({
        customerId: customer._id,
        issue: row.subject,
        status,
        createdAt: createdDate,
        history: [{ message: `Ticket created: ${row.subject}`, author: user._id, timestamp: createdDate }]
      });
      inserted++;
    } catch (e) {
      console.error(`Error processing row (${row.name} - ${row.subject}):`, e.message);
    }
  }

  console.log(`Finished. Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
  await mongoose.disconnect();
  console.log('Disconnected.');
}

// Run only when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDemoData().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
