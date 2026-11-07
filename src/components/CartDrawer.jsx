import { useEffect, useState } from "react";
import { money } from "../data/catalog.js";
import { useCart } from "../context/CartContext.jsx";
import ProductImage from "./ProductImage.jsx";

const EMPTY_FORM = { name: "", phone: "", address: "", comment: "" };

export default function CartDrawer() {
  const { items, total, count, isOpen, closeCart, changeQty, remove, clear } = useCart();
  const [step, setStep] = useState("cart"); // cart | form | done
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [orderId, setOrderId] = useState("");
  const [orderSaved, setOrderSaved] = useState(false);

  // Esc закриває кошик; тло не прокручується, поки кошик відкритий
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  // при повторному відкритті повертаємось до списку товарів (крім екрану «Дякуємо»)
  useEffect(() => {
    if (!isOpen && step === "form") setStep("cart");
    if (!isOpen && step === "done") setStep("cart");
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = "Вкажіть ім’я";
    if (form.phone.replace(/\D/g, "").length < 10) er.phone = "Вкажіть коректний номер телефону";
    if (!form.address.trim()) er.address = "Вкажіть адресу або відділення пошти";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const order = {
      id: "№" + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      customer: form,
      items: items.map((i) => ({
        id: i.id,
        name: i.product.name,
        price: i.product.price,
        qty: i.qty,
      })),
      total,
    };

    /* Для реального магазину підключіть відправку замовлення на сервер, наприклад:
       fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) });
       Зараз замовлення лише зберігається в браузері (демо-режим). */
    let saved = false;
    try {
      const all = JSON.parse(localStorage.getItem("kitchen-shop-orders") || "[]");
      const orders = Array.isArray(all) ? all : [];
      orders.push(order);
      localStorage.setItem("kitchen-shop-orders", JSON.stringify(orders));
      saved = true;
    } catch {
      /* Замовлення все одно не надсилається магазину. */
    }

    setOrderSaved(saved);
    setOrderId(order.id);
    setErrors({});
    clear();
    setForm(EMPTY_FORM);
    setStep("done");
  };

  return (
    <>
      <div className={`overlay ${isOpen ? "overlay--show" : ""}`} onClick={closeCart} />
      <aside
        className={`drawer ${isOpen ? "drawer--open" : ""}`}
        aria-hidden={!isOpen}
        aria-label="Кошик"
      >
        <div className="drawer__head">
          <h2>
            {step === "cart" && "Ваш кошик"}
            {step === "form" && "Оформлення замовлення"}
            {step === "done" && "Демо-замовлення"}
          </h2>
          <button type="button" className="icon-btn" onClick={closeCart} aria-label="Закрити кошик">
            ✕
          </button>
        </div>

        {step === "cart" && (
          <>
            <div className="drawer__body">
              {items.length === 0 ? (
                <p className="drawer__empty">Кошик порожній. Оберіть щось у каталозі 🙂</p>
              ) : (
                items.map(({ id, qty, product }) => (
                  <div className="line" key={id}>
                    <ProductImage product={product} className="line__img" />
                    <div className="line__info">
                      <div className="line__title">{product.name}</div>
                      <div className="line__price">
                        {money(product.price)} × {qty} = <b>{money(product.price * qty)}</b>
                      </div>
                      <div className="qty">
                        <button type="button" onClick={() => changeQty(id, -1)} aria-label="Менше">−</button>
                        <span>{qty}</span>
                        <button type="button" onClick={() => changeQty(id, 1)} aria-label="Більше">+</button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => remove(id)}
                      aria-label={`Видалити «${product.name}»`}
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="drawer__foot">
              <div className="drawer__total">
                <span>Разом ({count} шт.)</span>
                <b>{money(total)}</b>
              </div>
              <button
                type="button"
                className="btn btn--block"
                disabled={items.length === 0}
                onClick={() => setStep("form")}
              >
                Оформити замовлення
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                disabled={items.length === 0}
                onClick={clear}
              >
                Очистити кошик
              </button>
            </div>
          </>
        )}

        {step === "form" && (
          <form className="drawer__form" onSubmit={submit} noValidate>
            <div className="drawer__body">
              <label className="field">
                <span>Ім’я та прізвище *</span>
                <input name="name" value={form.name} onChange={onChange} autoComplete="name" className={errors.name ? "invalid" : ""} />
                {errors.name && <em>{errors.name}</em>}
              </label>
              <label className="field">
                <span>Телефон *</span>
                <input name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="+380…" autoComplete="tel" className={errors.phone ? "invalid" : ""} />
                {errors.phone && <em>{errors.phone}</em>}
              </label>
              <label className="field">
                <span>Місто та адреса / відділення пошти *</span>
                <input name="address" value={form.address} onChange={onChange} autoComplete="street-address" className={errors.address ? "invalid" : ""} />
                {errors.address && <em>{errors.address}</em>}
              </label>
              <label className="field">
                <span>Коментар</span>
                <textarea name="comment" rows="3" value={form.comment} onChange={onChange} />
              </label>
            </div>

            <div className="drawer__foot">
              <div className="drawer__total">
                <span>До сплати</span>
                <b>{money(total)}</b>
              </div>
              <button type="submit" className="btn btn--block">Підтвердити замовлення</button>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => setStep("cart")}>
                ← Назад до кошика
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="drawer__body drawer__done">
            <div className="drawer__done-icon">🎉</div>
            <h3>Дякуємо!</h3>
            <p>Демо-номер: <b>{orderId}</b></p>
            <p><b>Увага:</b> це демонстраційний режим. {orderSaved ? "Дані збережені лише в цьому браузері." : "Браузер не дозволив зберегти дані локально."} Магазин не отримав замовлення, і дзвінок не буде здійснено.</p>
            <button type="button" className="btn" onClick={closeCart}>Продовжити покупки</button>
          </div>
        )}
      </aside>
    </>
  );
}
