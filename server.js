const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine and static assets
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.use('/public', express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));

// Home - list proposals
app.get('/', (req, res) => {
  const proposals = db.getAllProposals();
  res.render('index', { proposals });
});

// New proposal form
app.get('/proposals/new', (req, res) => {
  const proposal = {
    companyName: '',
    personName: '',
    planName: 'Pro',
    date: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    amount: '',
    usersCount: 3,
    annualPricePerUser: '₹3,000',
    annualDiscountPercent: '33.33%',
    discountedAnnualPricing: '₹2,000 x 3',
  };
  res.render('form', { mode: 'create', proposal });
});

// Create proposal
app.post('/proposals', (req, res) => {
  const { companyName, personName, planName, date, usersCount } = req.body;
  const count = usersCount ? Number(usersCount) : 0;
  const perActual = 3000;
  const perDiscount = 2000;
  const annualPricePerUser = '₹3,000';
  const annualDiscountPercent = '33.33%';
  const discountedAnnualPricing = `₹2,000 x ${count || 0}`;
  const amount = `₹${(perDiscount * (count || 0)).toLocaleString('en-IN')}`;
  const id = db.createProposal({
    companyName,
    personName,
    planName,
    date,
    amount,
    usersCount: count || null,
    annualPricePerUser,
    annualDiscountPercent,
    discountedAnnualPricing,
  });
  // After creating, go back to the home list view
  res.redirect('/');
});

// View proposal
app.get('/proposals/:id', (req, res) => {
  const id = Number(req.params.id);
  const proposal = db.getProposalById(id);
  if (!proposal) return res.status(404).send('Proposal not found');
  res.render('show', { proposal });
});

// Edit proposal
app.get('/proposals/:id/edit', (req, res) => {
  const id = Number(req.params.id);
  const proposal = db.getProposalById(id);
  if (!proposal) return res.status(404).send('Proposal not found');
  res.render('form', { mode: 'edit', proposal });
});

// Update proposal
app.post('/proposals/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getProposalById(id);
  if (!existing) return res.status(404).send('Proposal not found');
  const { companyName, personName, planName, date, usersCount } = req.body;
  const count = usersCount ? Number(usersCount) : 0;
  const perActual = 3000;
  const perDiscount = 2000;
  const annualPricePerUser = '₹3,000';
  const annualDiscountPercent = '33.33%';
  const discountedAnnualPricing = `₹2,000 x ${count || 0}`;
  const amount = `₹${(perDiscount * (count || 0)).toLocaleString('en-IN')}`;
  db.updateProposal(id, {
    companyName,
    personName,
    planName,
    date,
    amount,
    usersCount: count || null,
    annualPricePerUser,
    annualDiscountPercent,
    discountedAnnualPricing,
  });
  // After updating, return to the home list to view all proposals
  res.redirect('/');
});

// Delete proposal
app.post('/proposals/:id/delete', (req, res) => {
  const id = Number(req.params.id);
  db.deleteProposal(id);
  res.redirect('/');
});

// Print-friendly HTML view (full page)
app.get('/proposals/:id/print', (req, res) => {
  const id = Number(req.params.id);
  const proposal = db.getProposalById(id);
  if (!proposal) return res.status(404).send('Proposal not found');
  // Render without the app layout so only the proposal is shown
  res.render('print', { proposal, layout: false });
});

// Generate PDF via Puppeteer
app.get('/proposals/:id/pdf', async (req, res) => {
  const id = Number(req.params.id);
  const proposal = db.getProposalById(id);
  if (!proposal) return res.status(404).send('Proposal not found');

  try {
    // Lazy import to reduce startup time
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
    });
    const page = await browser.newPage();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const printUrl = `${baseUrl}/proposals/${id}/print`;
    await page.goto(printUrl, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    });
    await browser.close();

    const filenameSafeCompany = (proposal.companyName || 'proposal')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameSafeCompany}-proposal.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    // Fallback: show error
    res.status(500).send(`Failed to generate PDF: ${String(err)}`);
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}`);
});


