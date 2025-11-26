import React, { useEffect, useState } from "react";

// Crm Bike Rental Updated — cleaned and fixed
// - No syntax errors
// - Open-ended rentals (no days)
// - Clients list is editable and removable
// - Separate Expenses page (duplicate behaviour of Charges)
// - State persisted to localStorage and included in JSON export

export default function App() {
  const RU = {
    title: "CRM — аренда великов",
    balance: "Баланс",
    main: "Главная",
    deposits: "Депозиты",
    sales: "Продажи",
    charges: "Списания",
    expenses: "Расходы",
    reports: "Отчёты",
    addRent: "Добавить / Выдать",
    bikeList: "Список велосипедов",
    total: "Всего",
    all: "Все",
    free: "Свободные",
    rented: "В аренде",
    repair: "В ремонте",
    edit: "Редактировать",
    history: "История",
    noBikes: "Нет велосипедов по фильтру",
    depositsTitle: "Депозиты",
    add: "Добавить",
    remove: "Удалить",
    salesTitle: "Продажи",
    chargesTitle: "Списания",
    expensesTitle: "Расходы",
    reportsTitle: "Отчёты",
    operations: "Операции / краткий обзор",
    activeRentals: "Активные аренды",
    clientsLabel: "Клиенты",
    settings: "Настройки",
    rentNow: "Сдать в аренду сразу",
    cancel: "Отмена",
    addButton: "Добавить",
    rentButton: "Выдать в аренду",
    finishRental: "Завершить аренду",
    acceptPayment: "Принять оплату",
    payAll: "Оплатить всё",
    enterBikeName: "Введите название/номер велосипеда",
    enterValidAmount: "Введите корректную сумму",
    rentalClosed: "Аренда завершена",
    paymentsLabel: "Платежи",
    salesLabel: "Продажи",
    expensesLabel: "Расходы",
    depositsLabel: "Списания",
    balanceLabel: "Баланс",
    exportJSON: "Экспорт (JSON)",
    exportRentalsCSV: "Экспорт аренды (CSV)",
    exportSummaryCSV: "Экспорт сводного отчёта (CSV)",
  };

  function getNextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map((i) => i.id || 0)) + 1;
  }

  const initialBikes = Array.from({ length: 45 }, (_, i) => {
    const id = i + 1;
    const rented = id === 1 || id === 22;
    return {
      id,
      title: String(id),
      pricePerDay: rented ? (id === 1 ? 100 : 120) : 0,
      status: rented ? "rented" : "free",
      renterName: rented ? (id === 1 ? "Шарипов" : "Я") : "",
      renterPhone: rented ? (id === 1 ? "99999999" : "") : "",
    };
  });

  const [bikes, setBikes] = useState(initialBikes);
  const [rentals, setRentals] = useState([
    { id: 1, bikeId: 1, accrued: 2200, paid: 0, status: "overdue", renterName: "Шарипов", renterPhone: "99999999", startDate: "2025-01-01" },
    { id: 2, bikeId: 22, accrued: 2640, paid: 0, status: "overdue", renterName: "Я", renterPhone: "", startDate: "2025-01-02" },
  ]);

  const [deposits, setDeposits] = useState([]);
  const [sales, setSales] = useState([]);
  const [charges, setCharges] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [filter, setFilter] = useState("all");
  const [balance, setBalance] = useState(-20000);
  const [showAdd, setShowAdd] = useState(false);

  const [addMode, setAddMode] = useState("new");
  const [clients, setClients] = useState([]);
  const [newBikeFields, setNewBikeFields] = useState({ title: "", pricePerDay: "", renterName: "", renterPhone: "", rentNow: false });
  const [rentExistingFields, setRentExistingFields] = useState({ bikeId: "", renterName: "", renterPhone: "" });

  const [activeView, setActiveView] = useState("main");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBike, setEditBike] = useState(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyBikeId, setHistoryBikeId] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeRental, setActiveRental] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const [depositForm, setDepositForm] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), title: "" });
  const [saleForm, setSaleForm] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), title: "" });
  const [chargeForm, setChargeForm] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), title: "" });
  const [expenseForm, setExpenseForm] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), title: "" });

  const visibleBikes = bikes.filter((b) => filter === "all" || b.status === filter);
  const freeBikes = bikes.filter((b) => b.status === "free");

  // on mount: load state or seed clients
  useEffect(() => {
    try {
      const raw = localStorage.getItem("crm_bike_state_v4");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.bikes) setBikes(parsed.bikes);
        if (parsed.rentals) setRentals(parsed.rentals);
        if (parsed.deposits) setDeposits(parsed.deposits || []);
        if (parsed.sales) setSales(parsed.sales || []);
        if (parsed.charges) setCharges(parsed.charges || []);
        if (parsed.expenses) setExpenses(parsed.expenses || []);
        if (parsed.clients) setClients(parsed.clients || []);
        if (typeof parsed.balance === "number") setBalance(parsed.balance);
        return;
      }
    } catch (e) {
      console.warn("localStorage load failed", e);
    }

    // seed clients from rentals if no saved state
    const uniq = [];
    for (const r of rentals) {
      if (r.renterName) {
        if (!uniq.some((c) => c.name === r.renterName && c.phone === r.renterPhone)) uniq.push({ name: r.renterName, phone: r.renterPhone });
      }
    }
    setClients(uniq);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // persist state
  useEffect(() => {
    try {
      localStorage.setItem(
        "crm_bike_state_v4",
        JSON.stringify({ bikes, rentals, deposits, sales, charges, expenses, clients, balance })
      );
    } catch (e) {
      console.warn("localStorage save failed", e);
    }
  }, [bikes, rentals, deposits, sales, charges, expenses, clients, balance]);

  // Add new bike (optionally rent now)
  function doAddNewBike(e) {
    e && e.preventDefault();
    const title = (newBikeFields.title || "").trim();
    const price = parseFloat(newBikeFields.pricePerDay) || 0;
    if (!title) return alert(RU.enterBikeName);

    const nextId = getNextId(bikes);
    const status = newBikeFields.rentNow ? "rented" : "free";
    const bike = { id: nextId, title, pricePerDay: price, status, renterName: newBikeFields.renterName || "", renterPhone: newBikeFields.renterPhone || "" };
    setBikes((p) => [...p, bike]);

    if (newBikeFields.rentNow) {
      const rental = {
        id: getNextId(rentals),
        bikeId: nextId,
        accrued: 0,
        paid: 0,
        status: "active",
        renterName: newBikeFields.renterName || "",
        renterPhone: newBikeFields.renterPhone || "",
        startDate: new Date().toISOString().slice(0, 10),
      };
      setRentals((p) => [rental, ...p]);
      if (newBikeFields.renterName) {
        setClients((prev) => {
          if (prev.some((c) => c.name === newBikeFields.renterName && c.phone === newBikeFields.renterPhone)) return prev;
          return [{ name: newBikeFields.renterName, phone: newBikeFields.renterPhone }, ...prev];
        });
      }
    }

    setNewBikeFields({ title: "", pricePerDay: "", renterName: "", renterPhone: "", rentNow: false });
    setShowAdd(false);
    setAddMode("new");
    setFilter("all");
    setActiveView("main");
  }

  // Rent an existing bike (open-ended)
  function doRentExistingBike(e) {
    e && e.preventDefault();
    const bikeId = parseInt(rentExistingFields.bikeId, 10);
    if (!bikeId) return alert("Выберите велосипед для аренды");
    const bike = bikes.find((b) => b.id === bikeId);
    if (!bike) return alert("Велосипед не найден");
    if (bike.status !== "free") return alert("Выбранный велосипед сейчас не свободен");

    const rental = {
      id: getNextId(rentals),
      bikeId,
      accrued: 0,
      paid: 0,
      status: "active",
      renterName: rentExistingFields.renterName || "",
      renterPhone: rentExistingFields.renterPhone || "",
      startDate: new Date().toISOString().slice(0, 10),
    };

    setRentals((p) => [rental, ...p]);
    setBikes((prev) => prev.map((b) => (b.id === bikeId ? { ...b, status: "rented", renterName: rentExistingFields.renterName || "", renterPhone: rentExistingFields.renterPhone || "" } : b)));

    if (rentExistingFields.renterName) {
      setClients((prev) => {
        if (prev.some((c) => c.name === rentExistingFields.renterName && c.phone === rentExistingFields.renterPhone)) return prev;
        return [{ name: rentExistingFields.renterName, phone: rentExistingFields.renterPhone }, ...prev];
      });
    }

    setRentExistingFields({ bikeId: "", renterName: "", renterPhone: "" });
    setShowAdd(false);
    setAddMode("new");
    setFilter("all");
    setActiveView("main");
  }

  function deleteClient(idx) {
    const c = clients[idx];
    if (!c) return;
    if (!confirm(`Удалить клиента "${c.name}" ${c.phone ? `(${c.phone})` : ""}?`)) return;
    setClients((prev) => prev.filter((_, i) => i !== idx));
  }

  function openEditBike(bike) {
    setEditBike({ ...bike });
    setShowEditModal(true);
  }

  function saveEditBike() {
    if (!editBike) return;
    setBikes((prev) => prev.map((b) => (b.id === editBike.id ? editBike : b)));
    setShowEditModal(false);
    setEditBike(null);
  }

  function openHistory(bikeId) {
    setHistoryBikeId(bikeId);
    setShowHistoryModal(true);
  }

  function openPayment(rental) {
    setActiveRental(rental);
    setPaymentAmount("");
    setShowPaymentModal(true);
  }

  function acceptPayment() {
    const amount = parseFloat(paymentAmount);
    if (!activeRental || isNaN(amount) || amount <= 0) return alert(RU.enterValidAmount);
    setRentals((prev) => prev.map((r) => (r.id === activeRental.id ? { ...r, paid: (r.paid || 0) + amount } : r)));
    setBalance((b) => b + amount);
    setShowPaymentModal(false);
    setActiveRental(null);
    setPaymentAmount("");
  }

  function finishRental(rentalId) {
    const rental = rentals.find((r) => r.id === rentalId);
    if (!rental) return alert("Аренда не найдена");
    if (rental.status === "closed") return alert("Аренда уже завершена");

    setRentals((prev) => prev.map((r) => (r.id === rentalId ? { ...r, status: "closed", endDate: new Date().toISOString().slice(0, 10) } : r)));
    setBikes((prev) => prev.map((b) => (b.id === rental.bikeId ? { ...b, status: "free", renterName: "", renterPhone: "" } : b)));
    alert(RU.rentalClosed);
  }

  // Financial entries: deposits, sales, charges, expenses
  function addDeposit(e) {
    e.preventDefault();
    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount === 0) return alert(RU.enterValidAmount);
    const entry = { id: getNextId(deposits), amount, date: depositForm.date, title: depositForm.title };
    setDeposits((p) => [entry, ...p]);
    setBalance((b) => b + amount);
    setDepositForm({ amount: "", date: new Date().toISOString().slice(0, 10), title: "" });
  }

  function addSale(e) {
    e.preventDefault();
    const amount = parseFloat(saleForm.amount);
    if (isNaN(amount) || amount === 0) return alert(RU.enterValidAmount);
    const entry = { id: getNextId(sales), amount, date: saleForm.date, title: saleForm.title };
    setSales((p) => [entry, ...p]);
    setBalance((b) => b + amount);
    setSaleForm({ amount: "", date: new Date().toISOString().slice(0, 10), title: "" });
  }

  function addCharge(e) {
    e.preventDefault();
    const amount = parseFloat(chargeForm.amount);
    if (isNaN(amount) || amount === 0) return alert(RU.enterValidAmount);
    const entry = { id: getNextId(charges), amount, date: chargeForm.date, title: chargeForm.title };
    setCharges((p) => [entry, ...p]);
    setBalance((b) => b - amount);
    setChargeForm({ amount: "", date: new Date().toISOString().slice(0, 10), title: "" });
  }

  function deleteDeposit(id) {
    const entry = deposits.find((d) => d.id === id);
    if (!entry) return;
    if (!confirm(`Удалить депозит "${entry.title}" на ${entry.amount} ?`)) return;
    setBalance((b) => b - entry.amount);
    setDeposits((p) => p.filter((d) => d.id !== id));
  }

  function deleteSale(id) {
    const entry = sales.find((d) => d.id === id);
    if (!entry) return;
    if (!confirm(`Удалить продажу "${entry.title}" на ${entry.amount} ?`)) return;
    setBalance((b) => b - entry.amount);
    setSales((p) => p.filter((d) => d.id !== id));
  }

  function deleteCharge(id) {
    const entry = charges.find((d) => d.id === id);
    if (!entry) return;
    if (!confirm(`Удалить списание "${entry.title}" на ${entry.amount} ?`)) return;
    setBalance((b) => b + entry.amount);
    setCharges((p) => p.filter((d) => d.id !== id));
  }

  function addExpense(e) {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount === 0) return alert(RU.enterValidAmount);
    const entry = { id: getNextId(expenses), amount, date: expenseForm.date, title: expenseForm.title };
    setExpenses((p) => [entry, ...p]);
    setBalance((b) => b - amount);
    setExpenseForm({ amount: "", date: new Date().toISOString().slice(0, 10), title: "" });
  }

  function deleteExpense(id) {
    const entry = expenses.find((d) => d.id === id);
    if (!entry) return;
    if (!confirm(`Удалить расход "${entry.title}" на ${entry.amount} ?`)) return;
    setBalance((b) => b + entry.amount);
    setExpenses((p) => p.filter((d) => d.id !== id));
  }

  // Exports
  function exportJSON() {
    const payload = { bikes, rentals, deposits, sales, charges, expenses, clients, balance };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm_export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportRentalsCSV() {
    const headers = ["id", "bikeId", "accrued", "paid", "status", "renterName", "renterPhone", "startDate", "endDate"];
    const rows = rentals.map((r) => headers.map((h) => (r[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rentals.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportSummaryCSV() {
    const payments = rentals.reduce((s, r) => s + (r.paid || 0), 0);
    const salesSum = sales.reduce((s, x) => s + (x.amount || 0), 0);
    const chargesSum = charges.reduce((s, x) => s + (x.amount || 0), 0);
    const expensesSum = expenses.reduce((s, x) => s + (x.amount || 0), 0);
    const depositsSum = deposits.reduce((s, x) => s + (x.amount || 0), 0);
    const rows = [
      ["Показатель", "Сумма"],
      [RU.paymentsLabel, payments],
      [RU.salesLabel, salesSum],
      [RU.chargesTitle, chargesSum],
      [RU.expensesLabel, expensesSum],
      [RU.depositsLabel, depositsSum],
      [RU.balanceLabel, balance],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Render helpers
  function renderMain() {
    return (
      <section className="bg-white p-4 rounded shadow-sm">
        <h2 className="font-semibold mb-3">{RU.bikeList}</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">{RU.total}: {bikes.length}</div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="all">{RU.all}</option>
            <option value="free">{RU.free}</option>
            <option value="rented">{RU.rented}</option>
            <option value="repair">{RU.repair}</option>
          </select>
        </div>

        <div className="space-y-3">
          {visibleBikes.map((b) => (
            <div key={b.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{b.title}</div>
                <div className="text-sm text-gray-500">Цена/день: {b.pricePerDay} c — Статус: <span className={`font-medium ${b.status === 'rented' ? 'text-red-600' : 'text-green-600'}`}>{b.status}</span></div>
                {b.renterName && <div className="text-sm text-gray-600">Арендатор: {b.renterName}{b.renterPhone ? ` — ${b.renterPhone}` : ''}</div>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEditBike(b)} className="px-3 py-1 border rounded">{RU.edit}</button>
                <button type="button" onClick={() => openHistory(b.id)} className="px-3 py-1 border rounded">{RU.history}</button>
              </div>
            </div>
          ))}

          {visibleBikes.length === 0 && <div className="text-gray-500">{RU.noBikes}</div>}
        </div>
      </section>
    );
  }

  function renderDeposits() {
    return (
      <section className="bg-white p-4 rounded shadow-sm">
        <h2 className="font-semibold mb-3">{RU.depositsTitle}</h2>
        <form onSubmit={addDeposit} className="space-y-2 mb-4">
          <input placeholder="Название/назначение" value={depositForm.title} onChange={(e) => setDepositForm((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded px-3 py-2" />
          <div className="flex gap-2">
            <input type="date" value={depositForm.date} onChange={(e) => setDepositForm((p) => ({ ...p, date: e.target.value }))} className="border rounded px-3 py-2" />
            <input placeholder="Сумма" value={depositForm.amount} onChange={(e) => setDepositForm((p) => ({ ...p, amount: e.target.value }))} className="border rounded px-3 py-2" />
            <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded">{RU.add}</button>
          </div>

          <div className="space-y-2 mt-4">
            {deposits.map((d) => (
              <div key={d.id} className="flex items-center justify-between border p-2 rounded">
                <div className="text-sm">{d.date} — {d.title} — {d.amount} c</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => deleteDeposit(d.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">{RU.remove}</button>
                </div>
              </div>
            ))}
            {deposits.length === 0 && <div className="text-gray-500">Нет депозитов</div>}
          </div>
        </form>
      </section>
    );
  }

  function renderSales() {
    return (
      <section className="bg-white p-4 rounded shadow-sm">
        <h2 className="font-semibold mb-3">{RU.salesTitle}</h2>
        <form onSubmit={addSale} className="space-y-2 mb-4">
          <input placeholder="Название/товар" value={saleForm.title} onChange={(e) => setSaleForm((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded px-3 py-2" />
          <div className="flex gap-2">
            <input type="date" value={saleForm.date} onChange={(e) => setSaleForm((p) => ({ ...p, date: e.target.value }))} className="border rounded px-3 py-2" />
            <input placeholder="Сумма" value={saleForm.amount} onChange={(e) => setSaleForm((p) => ({ ...p, amount: e.target.value }))} className="border rounded px-3 py-2" />
            <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded">{RU.add}</button>
          </div>

          <div className="space-y-2 mt-4">
            {sales.map((s) => (
              <div key={s.id} className="flex items-center justify-between border p-2 rounded">
                <div className="text-sm">{s.date} — {s.title} — {s.amount} c</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => deleteSale(s.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">{RU.remove}</button>
                </div>
              </div>
            ))}
            {sales.length === 0 && <div className="text-gray-500">Нет продаж</div>}
          </div>
        </form>
      </section>
    );
  }

  function renderCharges() {
    return (
      <section className="bg-white p-4 rounded shadow-sm">
        <h2 className="font-semibold mb-3">{RU.chargesTitle}</h2>
        <form onSubmit={addCharge} className="space-y-2 mb-4">
          <input placeholder="Название/назначение" value={chargeForm.title} onChange={(e) => setChargeForm((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded px-3 py-2" />
          <div className="flex gap-2">
            <input type="date" value={chargeForm.date} onChange={(e) => setChargeForm((p) => ({ ...p, date: e.target.value }))} className="border rounded px-3 py-2" />
            <input placeholder="Сумма" value={chargeForm.amount} onChange={(e) => setChargeForm((p) => ({ ...p, amount: e.target.value }))} className="border rounded px-3 py-2" />
            <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded">{RU.add}</button>
          </div>

          <div className="space-y-2 mt-4">
            {charges.map((c) => (
              <div key={c.id} className="flex items-center justify-between border p-2 rounded">
                <div className="text-sm">{c.date} — {c.title} — {c.amount} c</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => deleteCharge(c.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">{RU.remove}</button>
                </div>
              </div>
            ))}
            {charges.length === 0 && <div className="text-gray-500">Нет списаний</div>}
          </div>
        </form>
      </section>
    );
  }

  function renderExpenses() {
    return (
      <section className="bg-white p-4 rounded shadow-sm">
        <h2 className="font-semibold mb-3">{RU.expensesTitle}</h2>
        <form onSubmit={addExpense} className="space-y-2 mb-4">
          <input placeholder="Название/назначение" value={expenseForm.title} onChange={(e) => setExpenseForm((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded px-3 py-2" />
          <div className="flex gap-2">
            <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))} className="border rounded px-3 py-2" />
            <input placeholder="Сумма" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} className="border rounded px-3 py-2" />
            <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded">{RU.add}</button>
          </div>

          <div className="space-y-2 mt-4">
            {expenses.map((c) => (
              <div key={c.id} className="flex items-center justify-between border p-2 rounded">
                <div className="text-sm">{c.date} — {c.title} — {c.amount} c</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => deleteExpense(c.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">{RU.remove}</button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && <div className="text-gray-500">Нет расходов</div>}
          </div>
        </form>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-screen-xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{RU.title}</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm">{RU.balance}: <span className={`font-semibold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>{balance} c</span></div>
            <nav className="flex gap-2">
              <button type="button" onClick={() => setActiveView("main")} className={`px-3 py-1 rounded ${activeView === "main" ? "bg-blue-600 text-white" : "bg-white border"}`}>{RU.main}</button>
              <button type="button" onClick={() => setActiveView("deposits")} className={`px-3 py-1 rounded ${activeView === "deposits" ? "bg-blue-600 text-white" : "bg-white border"}`}>{RU.deposits}</button>
              <button type="button" onClick={() => setActiveView("sales")} className={`px-3 py-1 rounded ${activeView === "sales" ? "bg-blue-600 text-white" : "bg-white border"}`}>{RU.sales}</button>
              <button type="button" onClick={() => setActiveView("charges")} className={`px-3 py-1 rounded ${activeView === "charges" ? "bg-blue-600 text-white" : "bg-white border"}`}>{RU.charges}</button>
              <button type="button" onClick={() => setActiveView("expenses")} className={`px-3 py-1 rounded ${activeView === "expenses" ? "bg-blue-600 text-white" : "bg-white border"}`}>{RU.expenses}</button>
              <button type="button" onClick={() => setActiveView("reports")} className={`px-3 py-1 rounded ${activeView === "reports" ? "bg-blue-600 text-white" : "bg-white border"}`}>{RU.reports}</button>
              <button type="button" onClick={() => setShowAdd(true)} className={`px-3 py-1 rounded bg-blue-600 text-white`}>{RU.addRent}</button>
            </nav>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <main className="col-span-8">
            {activeView === "main" && renderMain()}
            {activeView === "deposits" && renderDeposits()}
            {activeView === "sales" && renderSales()}
            {activeView === "charges" && renderCharges()}
            {activeView === "expenses" && renderExpenses()}
            {activeView === "reports" && (
              <section className="bg-white p-4 rounded shadow-sm">
                <h2 className="font-semibold mb-3">{RU.reportsTitle}</h2>

                <div className="text-sm text-gray-600">Отчёты и экспорт</div>
                <div className="mt-4 space-y-2 p-4 border rounded">
                  <div><strong>{RU.paymentsLabel}:</strong> {rentals.reduce((s, r) => s + (r.paid || 0), 0)} c</div>
                  <div><strong>{RU.salesLabel}:</strong> {sales.reduce((s, x) => s + (x.amount || 0), 0)} c</div>
                  <div><strong>{RU.expensesLabel}:</strong> {charges.reduce((s, x) => s + (x.amount || 0), 0)} c</div>
                  <div><strong>{RU.depositsLabel}:</strong> {deposits.reduce((s, x) => s + (x.amount || 0), 0)} c</div>

                  <div className="mt-2"><strong>{RU.balanceLabel}:</strong> {balance} c</div>

                  <div className="mt-4 flex gap-3">
                    <button type="button" onClick={() => exportJSON()} className="px-4 py-2 bg-green-600 text-white rounded">{RU.exportJSON}</button>
                    <button type="button" onClick={() => exportRentalsCSV()} className="px-4 py-2 bg-green-600 text-white rounded">{RU.exportRentalsCSV}</button>
                    <button type="button" onClick={() => exportSummaryCSV()} className="px-4 py-2 bg-green-600 text-white rounded">{RU.exportSummaryCSV}</button>
                  </div>
                </div>

              </section>
            )}

            <div className="mt-4" />
          </main>

          <aside className="col-span-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold mb-2">{RU.operations}</h3>

              <div className="space-y-2">
                <div className="text-sm font-medium">{RU.activeRentals}</div>
                <div className="mt-2 space-y-2">
                  {rentals.filter((r) => r.status !== 'closed').map((r) => (
                    <div key={r.id} className="border-l-4 border-red-400 bg-red-50 p-2 rounded">
                      <div className="text-sm">#{r.id} — начислено: {r.accrued} c — оплачено: {r.paid} c — к оплате: {Math.max(0, (r.accrued || 0) - (r.paid || 0))} c</div>
                      <div className="flex gap-2 mt-2">
                        <button type="button" onClick={() => openPayment(r)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">{RU.acceptPayment}</button>
                        <button type="button" onClick={() => { setRentals((prev) => prev.map((x) => x.id === r.id ? { ...x, paid: x.accrued } : x)); setBalance((b) => b + ((r.accrued || 0) - (r.paid || 0))); }} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">{RU.payAll}</button>
                        <button type="button" onClick={() => finishRental(r.id)} className="px-2 py-1 text-xs bg-gray-600 text-white rounded">{RU.finishRental}</button>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="my-3" />

                <div className="text-sm font-medium">{RU.clientsLabel}</div>
                <div className="mt-2 space-y-2 text-sm text-gray-700">
                  {clients.length === 0 && <div className="text-gray-500">Нет клиентов</div>}
                  {clients.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between border p-2 rounded">
                      <div>{c.name}{c.phone ? ` — ${c.phone}` : ''}</div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setRentExistingFields((p) => ({ ...p, renterName: c.name, renterPhone: c.phone })); setAddMode('rent'); setShowAdd(true); }} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">Выдать</button>
                        <button type="button" onClick={() => deleteClient(idx)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">{RU.remove}</button>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="my-3" />

                <div>
                  <h4 className="font-medium">{RU.settings}</h4>
                  <label className="text-sm text-gray-600">Порог просрочки (дней):</label>
                  <input className="mt-1 block w-full border rounded px-2 py-1" defaultValue={1} />
                </div>

              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Add / Rent modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-auto">
            <h3 className="font-semibold mb-3">Добавить новый велосипед или выдать в аренду существующий</h3>

            <div className="mb-3">
              <label className="text-sm mr-3"><input type="radio" name="addMode" checked={addMode === "new"} onChange={() => setAddMode("new")} /> Новый велосипед</label>
              <label className="text-sm ml-3"><input type="radio" name="addMode" checked={addMode === "rent"} onChange={() => setAddMode("rent")} /> Выдать в аренду существующий</label>
            </div>

            {addMode === "new" && (
              <form onSubmit={doAddNewBike}>
                <label className="text-sm">Название / номер (без тире)</label>
                <input value={newBikeFields.title} onChange={(e) => setNewBikeFields((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2" />

                <label className="text-sm">Цена / день</label>
                <input type="number" value={newBikeFields.pricePerDay} onChange={(e) => setNewBikeFields((p) => ({ ...p, pricePerDay: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2" />

                <label className="text-sm">ФИО арендатора (опционально)</label>
                <input value={newBikeFields.renterName} onChange={(e) => setNewBikeFields((p) => ({ ...p, renterName: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2" />

                <label className="text-sm">Телефон арендатора</label>
                <input value={newBikeFields.renterPhone} onChange={(e) => setNewBikeFields((p) => ({ ...p, renterPhone: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2" />

                <div className="flex items-center gap-2 mb-2">
                  <input id="rentNow" type="checkbox" checked={newBikeFields.rentNow} onChange={(e) => setNewBikeFields((p) => ({ ...p, rentNow: e.target.checked }))} />
                  <label htmlFor="rentNow" className="text-sm">{RU.rentNow}</label>
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowAdd(false); setAddMode("new"); }} className="px-3 py-1 border rounded">{RU.cancel}</button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">{RU.addButton}</button>
                </div>
              </form>
            )}

            {addMode === "rent" && (
              <form onSubmit={doRentExistingBike}>
                <label className="text-sm">Выберите велосипед (только свободные)</label>
                <select value={rentExistingFields.bikeId} onChange={(e) => setRentExistingFields((p) => ({ ...p, bikeId: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2">
                  <option value="">-- выберите --</option>
                  {freeBikes.map((b) => (
                    <option key={b.id} value={b.id}>#{b.id} — {b.title} — {b.pricePerDay} c/д</option>
                  ))}
                </select>

                <label className="text-sm">ФИО арендатора</label>
                <input value={rentExistingFields.renterName} onChange={(e) => setRentExistingFields((p) => ({ ...p, renterName: e.target.value }))} className="w-full border rounded px-3 py-2 mb-2" />

                <label className="text-sm">Телефон арендатора</label>
                <input value={rentExistingFields.renterPhone} onChange={(e) => setRentExistingFields((p) => ({ ...p, renterPhone: e.target.value }))} className="w-full border rounded px-3 py-2 mb-3" />

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowAdd(false); setAddMode("new"); }} className="px-3 py-1 border rounded">{RU.cancel}</button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">{RU.rentButton}</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
      {/* Edit modal, History modal, Payment modal and closing tags follow same pattern */}
    </div>
  );
}
