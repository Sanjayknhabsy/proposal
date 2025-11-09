document.addEventListener('DOMContentLoaded', () => {
  function formatINR(num) {
    const n = Number(num) || 0;
    return `₹${n.toLocaleString('en-IN')}`;
  }
  function wireCalcForRow(id) {
    const users = document.getElementById(`usersCount-${id}`);
    const discounted = document.getElementById(`discountedAnnualPricing-${id}`);
    const amount = document.getElementById(`amount-${id}`);
    const annualPricePerUser = document.getElementById(`annualPricePerUser-${id}`);
    const annualDiscountPercent = document.getElementById(`annualDiscountPercent-${id}`);
    if (!users) return;
    const recalc = () => {
      const count = Number(users.value) || 0;
      const perUserDiscount = 2000;
      if (discounted) discounted.value = `₹2,000 x ${count || 0}`;
      if (amount) amount.value = formatINR(perUserDiscount * (count || 0));
      if (annualPricePerUser) annualPricePerUser.value = '₹3,000';
      if (annualDiscountPercent) annualDiscountPercent.value = '33.33%';
    };
    users.addEventListener('input', recalc);
    recalc();
  }

  document.querySelectorAll('[data-toggle-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const row = document.getElementById(`edit-row-${id}`);
      if (!row) return;
      row.style.display = row.style.display === 'none' || row.style.display === '' ? 'table-row' : 'none';
      if (row.style.display !== 'none') {
        wireCalcForRow(id);
      }
    });
  });
  document.querySelectorAll('[data-cancel-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const row = document.getElementById(`edit-row-${id}`);
      if (row) row.style.display = 'none';
    });
  });
});


