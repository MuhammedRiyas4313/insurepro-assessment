"use strict";

const INLINE_DATA = `Date,SKU,Unit Price,Quantity,Total Price
2019-01-01,Death by Chocolate,180,5,900
2019-01-01,Cake Fudge,150,1,150
2019-01-01,Cake Fudge,150,1,150
2019-01-01,Cake Fudge,150,3,450
2019-01-01,Death by Chocolate,180,1,180
2019-01-01,Vanilla Double Scoop,80,3,240
2019-01-01,Butterscotch Single Scoop,60,5,300
2019-01-01,Vanilla Single Scoop,50,5,250
2019-01-01,Cake Fudge,150,5,750
2019-01-01,Hot Chocolate Fudge,120,3,360
2019-01-01,Butterscotch Single Scoop,60,5,300
2019-01-01,Chocolate Europa Double Scoop,100,1,100
2019-01-01,Hot Chocolate Fudge,120,2,240
2019-01-01,Caramel Crunch Single Scoop,70,4,280
2019-01-01,Hot Chocolate Fudge,120,2,240
2019-01-01,Hot Chocolate Fudge,120,4,480
2019-01-01,Hot Chocolate Fudge,120,2,240
2019-01-01,Cafe Caramel,160,5,800
2019-01-01,Vanilla Double Scoop,80,4,320
2019-01-01,Butterscotch Single Scoop,60,3,180
2019-02-01,Butterscotch Single Scoop,60,3,180
2019-02-01,Vanilla Single Scoop,50,2,100
2019-02-01,Butterscotch Single Scoop,60,3,180
2019-02-01,Vanilla Double Scoop,80,1,80
2019-02-01,Death by Chocolate,180,2,360
2019-02-01,Cafe Caramel,160,2,320
2019-02-01,Pista Single Scoop,60,3,180
2019-02-01,Hot Chocolate Fudge,120,2,240
2019-02-01,Vanilla Single Scoop,50,3,150
2019-02-01,Vanilla Single Scoop,50,5,250
2019-02-01,Cake Fudge,150,1,150
2019-02-01,Vanilla Single Scoop,50,4,200
2019-02-01,Vanilla Double Scoop,80,3,240
2019-02-01,Cake Fudge,150,1,150
2019-02-01,Vanilla Double Scoop,80,5,400
2019-02-01,Hot Chocolate Fudge,120,5,600
2019-02-01,Vanilla Double Scoop,80,2,160
2019-02-01,Vanilla Double Scoop,80,3,240
2019-02-01,Hot Chocolate Fudge,120,5,600
2019-02-01,Cake Fudge,150,5,750
2019-03-01,Vanilla Single Scoop,50,5,250
2019-03-01,Cake Fudge,150,5,750
2019-03-01,Pista Single Scoop,60,1,60
2019-03-01,Butterscotch Single Scoop,60,2,120
2019-03-01,Vanilla Double Scoop,80,1,80
2019-03-01,Cafe Caramel,160,1,160
2019-03-01,Cake Fudge,150,5,750
2019-03-01,Trilogy,160,5,800
2019-03-01,Butterscotch Single Scoop,60,3,180
2019-03-01,Death by Chocolate,180,2,360
2019-03-01,Butterscotch Single Scoop,60,1,60
2019-03-01,Hot Chocolate Fudge,120,3,360
2019-03-01,Cake Fudge,150,2,300
2019-03-01,Cake Fudge,150,2,300
2019-03-01,Vanilla Single Scoop,50,4,100
2019-03-01,Cafe Caramel,160,0,160
2019-03-01,Cake Fudge,150,5,750
2019-03-01,Cafe Caramel,160,5,800
2019-03-01,Almond Fudge,150,1,150
2019-03-01,Cake Fudge,150,1,150`;

function processData(rawDataArr) {
  let errors = {};
  let totalSale = 0;
  let monthlySale = {};
  const uniqueSKU = new Set();

  for (let i = 1; i < rawDataArr.length; i++) {
    const raw = rawDataArr[i]?.split(",");

    const date = raw[0];
    const sku = raw.slice(1, raw?.length - 3)?.join(",");
    const total = parseFloat(raw[raw?.length - 1]);
    const qty = parseInt(raw[raw?.length - 2], 10);
    const price = parseFloat(raw[raw?.length - 3]);

    const month = date?.slice(0, 7); // 'YYYY-MM'

    //VALIDATE DATA
    if (Math.abs(price * qty - total) > 0.01) {
      errors[i + 1] = {
        msg: `Unit Price * Quantity! = Total Price`,
        data: raw,
      };
      continue;
    }
    if (qty < 1) {
      errors[i + 1] = { msg: `Quantity is < 1`, data: raw };
      continue;
    }
    if (price < 0) {
      errors[i + 1] = { msg: `Unit Price is < 0`, data: raw };
      continue;
    }
    if (total < 0) {
      errors[i + 1] = { msg: `Total Price is < 0`, data: raw };
      continue;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
      errors[i + 1] = { msg: `Date is malformed`, data: raw };
      continue;
    }

    //PROCESS VALID DATA
    totalSale += total;

    if (!monthlySale[month]) {
      monthlySale[month] = {
        total: 0,
        items: {},
      };
    }

    const currMonth = monthlySale[month];
    currMonth.total += total;

    if (!currMonth?.items[sku]) {
      currMonth.items[sku] = {
        orderCount: 0,
        qty: 0,
        minOrder: Infinity,
        maxOrder: -Infinity,
        revenue: 0,
      };
    }

    uniqueSKU.add(sku);

    const item = currMonth?.items[sku];
    item.orderCount += 1;
    item.qty += qty;
    item.revenue += total;
    if (qty < item.minOrder) item.minOrder = qty;
    if (qty > item.maxOrder) item.maxOrder = qty;
  }
  return { totalSale, monthlySale, uniqueSKU, errors };
}

//MOST POPULAR OF EACH MONTH AND MIN, MAX, AVG
function reports(months, monthlySale) {
  for (let i = 0; i < months.length; i++) {
    let mostPopular = null;
    let mostSold = -Infinity;
    let maxRevenue = -Infinity;
    let maxRevenueItem = null;

    const items = monthlySale[months[i]].items;
    for (const sku in items) {
      if (items[sku].qty > mostSold) {
        mostPopular = sku;
        mostSold = items[sku].qty;
      }
      if (items[sku].revenue > maxRevenue) {
        maxRevenue = items[sku].revenue;
        maxRevenueItem = sku;
      }
    }

    let average = items[mostPopular].qty / items[mostPopular].orderCount;
    let monthSale = monthlySale[months[i]].total;

    console.log(
      `=======================${months[i]}===============================`,
    );
    console.log(`Total Sale = ${monthSale?.toFixed(2)}`);
    console.log(`Popular Item = ${mostPopular}(${mostSold})`);
    console.log(`${mostPopular} Min Order = ${items[mostPopular].minOrder}`);
    console.log(`${mostPopular} Max Order = ${items[mostPopular].maxOrder}`);
    console.log(`${mostPopular} Avg Order = ${average.toFixed(2)}`);
    console.log(
      `${months[i]} Most Revenue Generated Item = ${maxRevenueItem}(${maxRevenue?.toFixed(2)})`,
    );
    console.log(
      "========================================================================================",
    );
    console.log(
      "========================================================================================",
    );
  }
}

function growth(months, monthlySale, uniqueSKU) {
  for (const sku of uniqueSKU) {
    console.log(`\nSKU: ${sku}`);
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1];
      const curr = months[i];

      const prevQty = monthlySale[prev].items[sku]?.qty ?? 0;
      const currQty = monthlySale[curr].items[sku]?.qty ?? 0;

      let growth;
      if (prevQty === 0) {
        growth = currQty > 0 ? "New entry (∞%)" : "— no sales in either month";
      } else {
        const pct = ((currQty - prevQty) / prevQty) * 100;
        growth = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
      }

      console.log(`${prev} → ${curr} :  ${growth}`);
    }
  }
  console.log(
    "========================================================================================",
  );
  console.log(
    "========================================================================================",
  );
}

function malformed(err) {
  if (Object.keys(err).length === 0) {
    console.log("   ✓ No inconsistencies found.\n");
    return;
  }
  console.log(`   ${Object.keys(err)?.length} problematic row(s):\n`);
  for (const e in err) {
    console.log(`Row ${e}: ${err[e].data}`);
    console.log(`└─ ${err[e].msg}\n`);
  }
}

function main() {
  const lines = INLINE_DATA?.split("\n").filter((line) => line?.trim() !== "");

  const { totalSale, monthlySale, uniqueSKU, errors } = processData(lines);

  const months = Object.keys(monthlySale).sort();

  console.log("Total Store Sales = ", parseFloat(totalSale).toFixed(2));

  console.log(
    "========================================================================================",
  );
  console.log(
    "========================================================================================",
  );
  reports(months, monthlySale);
  growth(months, monthlySale, uniqueSKU);
  malformed(errors);
}

main();

//===============================================================================

//Question Answers

/*

Q1) What was the most complex part for you personally, and why?

   Designing the data model so that ALL six reports could be derived from a
   SINGLE pass over the rows. The temptation is to loop separately for each
   report, but that multiplies CPU cost by the number of reports. The key was
   maintaining running minOrder, maxOrder, and sumOrder inside each SKU bucket
   so that post-pass calculations are O(1) lookups — no second scan, no
   stack-unsafe Math.min(...largeArray) spread.

Q2) A bug I expected to hit, and how I would debug it:

   Month-to-month growth when an SKU exists in month 3 but not month 2. A
   naive map lookup returns undefined, and arithmetic on undefined silently
   produces NaN that propagates through all downstream output. Fix: default
   missing months to 0 with optional chaining + nullish coalescing:
   `monthMap.get(prev).items.get(sku)?.qty ?? 0`.
   To debug: log prevQty and currQty for each transition and grep for 'NaN'.

Q3) Does this solution handle larger datasets without performance implications?

   - Time:   O(n) — one pass over all rows; Map lookups are O(1) average.
   - Memory: O(months × SKUs) — only aggregates are kept, not raw rows.
             A 10M-row file with 1,000 SKUs across 12 months uses megabytes.
   - Stack:  Safe — running min/max avoids Math.min(...spread) which throws
             RangeError beyond ~100,000 elements.

   The one remaining constraint is that split('\n') loads the full string into
   RAM upfront. For truly gigabyte-scale files, Node's built-in readline module
   would stream line-by-line without loading the whole file — but since the
   brief says no extra modules, this in-memory approach is the optimal solution
   within those constraints.

*/
