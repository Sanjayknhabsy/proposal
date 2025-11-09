document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('proposal-form');
  if (!form) return;

  const bindings = {
    companyName: document.querySelectorAll('[data-bind="companyName"]'),
    personName: document.querySelectorAll('[data-bind="personName"]'),
    planName: document.querySelectorAll('[data-bind="planName"]'),
    date: document.querySelectorAll('[data-bind="date"]'),
    amount: document.querySelectorAll('[data-bind="amount"]'),
    usersCount: document.querySelectorAll('[data-bind="usersCount"]'),
    annualPricePerUser: document.querySelectorAll('[data-bind="annualPricePerUser"]'),
    annualDiscountPercent: document.querySelectorAll('[data-bind="annualDiscountPercent"]'),
    discountedAnnualPricing: document.querySelectorAll('[data-bind="discountedAnnualPricing"]'),
  };

  function updateBind(name, value) {
    (bindings[name] || []).forEach((el) => {
      el.textContent = value || '';
    });
  }

  function formatINR(num) {
    const n = Number(num) || 0;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  function recalcFromUsers() {
    const usersInput = document.getElementById('usersCount');
    const count = Number(usersInput && usersInput.value) || 0;
    // Business rule: Actual ₹3,000 per user, discounted ₹2,000 per user
    const perUserDiscount = 2000;
    const discountedPricingText = `₹2,000 x ${count || 0}`;
    const finalAmount = formatINR(perUserDiscount * (count || 0));
    const annualPricePerUser = '₹3,000';
    const annualDiscountPercent = '33.33%';
    updateBind('usersCount', String(count || 0));
    updateBind('discountedAnnualPricing', discountedPricingText);
    updateBind('amount', finalAmount);
    updateBind('annualPricePerUser', annualPricePerUser);
    updateBind('annualDiscountPercent', annualDiscountPercent);
    const discountedAnnualPricingInput = document.getElementById('discountedAnnualPricing');
    const amountInput = document.getElementById('amount');
    const annualPricePerUserInput = document.getElementById('annualPricePerUser');
    const annualDiscountPercentInput = document.getElementById('annualDiscountPercent');
    if (discountedAnnualPricingInput) discountedAnnualPricingInput.value = discountedPricingText;
    if (amountInput) amountInput.value = finalAmount;
    if (annualPricePerUserInput) annualPricePerUserInput.value = annualPricePerUser;
    if (annualDiscountPercentInput) annualDiscountPercentInput.value = annualDiscountPercent;
  }

  function wire(id, name) {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => updateBind(name, input.value));
  }

  wire('companyName', 'companyName');
  wire('personName', 'personName');
  wire('planName', 'planName');
  wire('date', 'date');
  wire('amount', 'amount');
  wire('usersCount', 'usersCount');
  wire('annualPricePerUser', 'annualPricePerUser');
  wire('annualDiscountPercent', 'annualDiscountPercent');
  wire('discountedAnnualPricing', 'discountedAnnualPricing');

  const usersInput = document.getElementById('usersCount');
  if (usersInput) {
    usersInput.addEventListener('input', recalcFromUsers);
    // Initialize derived fields on load
    recalcFromUsers();
  }
});


