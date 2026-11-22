import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { money } from "../data/catalog.js";
import { useCart } from "../context/CartContext.jsx";
import ProductImage from "./ProductImage.jsx";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../lib/supabase.js";

const EMPTY_FORM = { name: "", phone: "", address: "", comment: "" };
const MANAGER_WHATSAPP = "380980998127";

export default function CartDrawer() {
  const { items, total, count, isOpen, closeCart, changeQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const continueShopping = () => { closeCart(); setStep("cart"); navigate("/catalog"); };
  const [step, setStep] = useState("cart"); // cart | form | done
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [orderId, setOrderId] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

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
    if (form.name.trim().length < 2) er.name = "Вкажіть ім’я та прізвище";
    if (form.phone.replace(/\D/g, "").length < 10) er.phone = "Вкажіть коректний номер телефону";
    if (!form.address.trim()) er.address = "Вкажіть адресу або відділення пошти";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          requestId,
          customer: { name: form.name, phone: form.phone, address: form.address, comment: form.comment },
          items: items.map((item) => ({ id: item.id, qty: item.qty })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.orderNumber) {
        throw new Error(result.error || "Не вдалося оформити замовлення. Спробуйте ще раз.");
      }

      const orderNumber = String(result.orderNumber);
      const serverTotal = Number(result.total);
      const orderLines = items.map((item, index) => `${index + 1}. ${item.product.name} — ${item.qty} шт.`).join("\n");
      const message = [
        `ПІДТВЕРДЖЕНЕ ЗАМОВЛЕННЯ №${orderNumber}`,
        "",
        "ТОВАРИ:",
        orderLines,
        `Сума за даними магазину: ${Number.isFinite(serverTotal) ? money(serverTotal) : "уточнюється"}`,
        "",
        `Клієнт: ${form.name}`,
        `Телефон: ${form.phone}`,
        `Адреса / доставка: ${form.address}`,
        form.comment ? `Коментар: ${form.comment}` : "",
      ].filter(Boolean).join("\n");
      setWhatsappUrl(`https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent(message)}`);
      setOrderId(orderNumber);
      clear();
      setForm(EMPTY_FORM);
      setRequestId(crypto.randomUUID());
      setStep("done");
    } catch (error) {
      setErrors({ general: error?.message || "Сталася помилка. Спробуйте ще раз." });
    } finally {
      setSubmitting(false);
    }
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
            {step === "done" && "Замовлення оформлено"}
          </h2>
          <button type="button" className="icon-btn" onClick={closeCart} aria-label="Закрити кошик">
            ✕
          </button>
        </div>

        {step === "cart" && (
          <>
            <div className="drawer__body">
              {items.length === 0 ? (
                <div className="drawer__empty"><p>Кошик порожній. Оберіть щось у каталозі 🙂</p><button type="button" className="btn btn--ghost" onClick={continueShopping}>← Повернутися до покупок</button></div>
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
              <button type="button" className="btn btn--ghost btn--block" onClick={continueShopping}>
                ← Повернутися до покупок
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
              {errors.general && <p className="field-error" role="alert">{errors.general}</p>}
            </div>

            <div className="drawer__foot">
              <div className="drawer__total">
                <span>Попередня сума</span>
                <b>{money(total)}</b>
              </div>
              <button type="submit" className="btn btn--block" disabled={submitting || items.length === 0}>{submitting ? "Зберігаємо замовлення…" : "Підтвердити замовлення"}</button>
              <button type="button" className="btn btn--ghost btn--block" disabled={submitting} onClick={() => setStep("cart")}>
                ← Назад до кошика
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="drawer__body drawer__done">
            <div className="drawer__done-icon">🎉</div>
            <h3>Дякуємо!</h3>
            <p>Номер замовлення: <b>№{orderId}</b></p>
            <p>Замовлення успішно збережено в базі магазину. Менеджер зможе переглянути його в адміністративній панелі та зв’язатися з вами.</p>
            {whatsappUrl && <a className="btn" href={whatsappUrl} target="_blank" rel="noreferrer">Повідомити менеджера у WhatsApp</a>}
            <button type="button" className="btn" onClick={continueShopping}>← Повернутися до покупок</button>
          </div>
        )}
      </aside>
    </>
  );
}
