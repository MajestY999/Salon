import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/Admin.module.css";
import {
  createAdminService,
  deleteAdminAppointment,
  deleteAdminService,
  deleteAllAdminAppointments,
  getAdminAppointments,
  getMasters,
  getServices,
  loginAdmin,
  updateAdminAppointment,
  updateAdminService,
} from "../utils/api";

const SCHEDULES_KEY = "simple_schedules";
const ADMIN_TOKEN_KEY = "admin_token";

function readJSON(key) {
  const raw = localStorage.getItem(key);
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeJSON(key, v) {
  localStorage.setItem(key, JSON.stringify(v ?? []));
}

// соответствия дней
const RU_TO_KEY = {
  Пн: "Mon",
  Вт: "Tue",
  Ср: "Wed",
  Чт: "Thu",
  Пт: "Fri",
  Сб: "Sat",
  Вс: "Sun",
};
const KEY_TO_RU = {
  Mon: "Пн",
  Tue: "Вт",
  Wed: "Ср",
  Thu: "Чт",
  Fri: "Пт",
  Sat: "Сб",
  Sun: "Вс",
};
const VALID_KEYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

// вспомогательное для времени
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function toHHMM(h, m) {
  const hh = String(clamp(h, 0, 23)).padStart(2, "0");
  const mm = String(clamp(m, 0, 59)).padStart(2, "0");
  return `${hh}:${mm}`;
}
function parseHHMM(str) {
  const m = String(str).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return {
    h: clamp(Number(m[1]) || 0, 0, 23),
    m: clamp(Number(m[2]) || 0, 0, 59),
  };
}
function normalizeTime(t) {
  const m = String(t).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const hh = clamp(Number(m[1]) || 0, 0, 23);
  const mm = clamp(Number(m[2]) || 0, 0, 59);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// нормализация расписания
function normalizeSchedule(s) {
  const legacyEmptySchedule =
    Array.isArray(s.workDays) &&
    s.workDays.length === 0 &&
    (!s.startTime || s.startTime === "09:00");
  const rawDays =
    Array.isArray(s.workDays) && !legacyEmptySchedule
      ? s.workDays
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayKeys = rawDays
    .map((d) => (VALID_KEYS.has(d) ? d : RU_TO_KEY[d] || null))
    .filter(Boolean);
  const uniqueDays = Array.from(new Set(dayKeys)).filter((k) =>
    VALID_KEYS.has(k),
  );
  const start = normalizeTime(s.startTime || "10:00") || "10:00";
  const end = normalizeTime(s.endTime || "21:00") || "21:00";
  return {
    barberId: s.barberId,
    workDays: uniqueDays,
    startTime: start,
    endTime: end,
  };
}

// компонент ввода времени
function TimeInput({ value, onChange, placeholder = "00:00", className }) {
  const [text, setText] = useState(value || "");

  useEffect(() => {
    setText(value || "");
  }, [value]);

  const commit = (raw) => {
    const norm = normalizeTime(raw) || "";
    setText(norm);
    onChange?.(norm);
  };

  const handleInput = (e) => {
    let v = e.target.value.replace(/[^\d:]/g, "");
    if (/^\d{3,}$/.test(v)) v = v.slice(0, 4);
    if (/^\d{2}$/.test(v)) v = v + ":";
    const parts = v.split(":");
    const hh = parts[0]?.slice(0, 2) || "";
    const mm = (parts[1] || "").slice(0, 2);
    v = parts.length > 1 ? `${hh}:${mm}` : hh;
    setText(v);
  };

  const handleBlur = () => commit(text);

  const handleKeyDown = (e) => {
    const cur = parseHHMM(text) || parseHHMM(value) || { h: 0, m: 0 };
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.ctrlKey ? 10 : 1;
      let h = cur.h;
      let m = cur.m;
      if (e.key === "ArrowUp") {
        if (e.shiftKey) h = (h + 1) % 24;
        else {
          m += step;
          while (m > 59) {
            m -= 60;
            h = (h + 1) % 24;
          }
        }
      } else {
        if (e.shiftKey) h = (h - 1 + 24) % 24;
        else {
          m -= step;
          while (m < 0) {
            m += 60;
            h = (h - 1 + 24) % 24;
          }
        }
      }
      const next = toHHMM(h, m);
      setText(next);
      onChange?.(next);
    }
  };

  return (
    <input
      className={className}
      inputMode="numeric"
      placeholder={placeholder}
      value={text}
      onChange={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label="Время ЧЧ:ММ"
      title="Введите время в формате ЧЧ:ММ"
    />
  );
}

function toAdminAppointment(item) {
  const status =
    {
      Pending: "pending",
      Confirmed: "confirmed",
      Cancelled: "cancelled",
    }[item.status] || "pending";
  return { ...item, status };
}

function toApiStatus(status) {
  return (
    {
      new: "Pending",
      pending: "Pending",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
    }[status] || "Pending"
  );
}

export default function Admin() {
  const navigate = (path = "/") => {
    window.location.href = path;
  };

  // мастера
  const [barbers, setBarbers] = useState([]);
  const [dataError, setDataError] = useState("");
  useEffect(() => {
    let mounted = true;
    getMasters()
      .then((list) => {
        if (mounted) setBarbers(list || []);
      })
      .catch((loadError) => {
        if (mounted) setDataError(loadError.message);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const [tab, setTab] = useState("records");
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // toast
  const [toast, setToast] = useState("");

  // auth
  const [passInput, setPassInput] = useState("");
  const [authorized, setAuthorized] = useState(
    Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY)),
  );
  const [loginInput, setLoginInput] = useState("admin");
  const [error, setError] = useState("");

  // загрузка данных после авторизации
  useEffect(() => {
    if (!authorized) return;

    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    Promise.all([getAdminAppointments(token), getServices()])
      .then(([appointments, loadedServices]) => {
        setItems(appointments.map(toAdminAppointment));
        setServices(
          loadedServices.map((service) => ({
            ...service,
            price: Number(service.price),
          })),
        );
        setDataError("");
      })
      .catch((loadError) => {
        setDataError(loadError.message);
        if (loadError.message.includes("токен")) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAuthorized(false);
        }
      });

    const arr = readJSON(SCHEDULES_KEY);
    const obj = {};
    (Array.isArray(arr) ? arr : []).forEach((s) => {
      const ns = normalizeSchedule(s);
      if (ns.barberId != null) obj[ns.barberId] = ns;
    });
    for (const b of barbers) {
      if (!obj[b.id]) {
        obj[b.id] = {
          barberId: b.id,
          workDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          startTime: "10:00",
          endTime: "21:00",
        };
      }
    }
    setSchedules(obj);
    writeJSON(SCHEDULES_KEY, Object.values(obj));
  }, [authorized, barbers]);

  // sync по storage
  useEffect(() => {
    const onStorage = (e) => {
      if (!authorized) return;
      if (e.key === SCHEDULES_KEY) {
        const arr = readJSON(SCHEDULES_KEY);
        const obj = {};
        (Array.isArray(arr) ? arr : []).forEach((s) => {
          const ns = normalizeSchedule(s);
          if (ns.barberId != null) obj[ns.barberId] = ns;
        });
        setSchedules(obj);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [authorized]);

  // вход/выход
  const submitPass = async (e) => {
    e?.preventDefault();
    try {
      const { token } = await loginAdmin(loginInput, passInput);
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      setAuthorized(true);
      setError("");
      setPassInput("");
    } catch (loginError) {
      setError(loginError.message);
    }
  };
  const logout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAuthorized(false);
    setItems([]);
    setServices([]);
    setSchedules({});
    setQuery("");
    setStatusFilter("all");
    setDateFilter("");
    setPassInput("");
    setError("");
    navigate("/");
  };

  // фильтр записей
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (x) =>
        (!q ||
          (x.name || "").toLowerCase().includes(q) ||
          (x.barberName || "").toLowerCase().includes(q) ||
          (x.serviceName || "").toLowerCase().includes(q) ||
          (x.dateStr || "").toLowerCase().includes(q) ||
          (x.timeStr || "").toLowerCase().includes(q)) &&
        (!dateFilter || x.date === dateFilter) &&
        (statusFilter === "all" ||
          (statusFilter === "pending"
            ? !x.status || x.status === "new" || x.status === "pending"
            : x.status === statusFilter)),
    );
  }, [items, query, statusFilter, dateFilter]);

  const appointmentStats = [
    { label: "Всего заявок", value: items.length, style: styles.statBlue },
    {
      label: "В ожидании",
      value: items.filter(
        (item) =>
          !item.status || item.status === "new" || item.status === "pending",
      ).length,
      style: styles.statAmber,
    },
    {
      label: "Подтверждено",
      value: items.filter((item) => item.status === "confirmed").length,
      style: styles.statGreen,
    },
    {
      label: "Отменено",
      value: items.filter((item) => item.status === "cancelled").length,
      style: styles.statRed,
    },
  ];

  // записи
  const removeItem = (id) => {
    deleteAdminAppointment(sessionStorage.getItem(ADMIN_TOKEN_KEY), id)
      .then(() =>
        setItems((current) => current.filter((item) => item.id !== id)),
      )
      .catch((requestError) => setDataError(requestError.message));
  };
  const markDone = (id) => {
    // можно спросить подтверждение:
    // if (!window.confirm('Удалить запись как выполненную?')) return;
    removeItem(id);
  };
  const updateNote = (id, note) => {
    const list = items.map((x) => (x.id === id ? { ...x, note } : x));
    setItems(list);
  };
  const saveNote = (id, note) => {
    updateAdminAppointment(sessionStorage.getItem(ADMIN_TOKEN_KEY), id, {
      note,
    }).catch((requestError) => setDataError(requestError.message));
  };
  const setStatus = (id, status) => {
    updateAdminAppointment(sessionStorage.getItem(ADMIN_TOKEN_KEY), id, {
      status: toApiStatus(status),
    })
      .then(({ appointment }) => {
        setItems((current) =>
          current.map((item) =>
            item.id === id ? toAdminAppointment(appointment) : item,
          ),
        );
        setDataError("");
      })
      .catch((requestError) => setDataError(requestError.message));
  };
  const clearAll = () => {
    if (!window.confirm("Удалить все записи?")) return;
    deleteAllAdminAppointments(sessionStorage.getItem(ADMIN_TOKEN_KEY))
      .then(() => setItems([]))
      .catch((requestError) => setDataError(requestError.message));
  };

  // услуги
  const reloadServices = async () => {
    const loadedServices = await getServices();
    setServices(loadedServices);
  };
  const deleteService = async (id) => {
    if (!window.confirm("Удалить услугу?")) return;
    try {
      await deleteAdminService(sessionStorage.getItem(ADMIN_TOKEN_KEY), id);
      await reloadServices();
    } catch (requestError) {
      setDataError(requestError.message);
    }
  };

  // расписания
  const saveSchedules = (obj) => {
    setSchedules(obj);
    writeJSON(SCHEDULES_KEY, Object.values(obj));
    setToast("Расписания сохранены");
    clearTimeout(window.__admin_toast_timer);
    window.__admin_toast_timer = setTimeout(() => setToast(""), 2500);
  };
  const updateScheduleFor = (barberId, patch) => {
    const cur = schedules[barberId] || {
      barberId,
      workDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: "10:00",
      endTime: "21:00",
    };
    const next = normalizeSchedule({ ...cur, ...patch, barberId });
    const obj = { ...schedules, [barberId]: next };
    saveSchedules(obj);
  };

  // форма услуг
  const [svcForm, setSvcForm] = useState({
    id: null,
    name: "",
    price: "",
    duration: "60",
  });
  const startAddService = () =>
    setSvcForm({ id: null, name: "", price: "", duration: "60" });
  const startEditService = (s) =>
    setSvcForm({
      id: s.id,
      name: s.name || "",
      price: String(s.price ?? ""),
      duration: String(s.duration ?? 60),
    });
  const submitServiceForm = async (e) => {
    e.preventDefault();
    const name = (svcForm.name || "").trim();
    const price = Number(svcForm.price);
    const duration = Number(svcForm.duration);
    if (!name) return;
    if (!Number.isFinite(price) || price < 0) return;
    if (!Number.isSafeInteger(duration) || duration < 1) return;

    try {
      const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
      const service = { name, price, duration };
      if (svcForm.id == null) await createAdminService(token, service);
      else await updateAdminService(token, svcForm.id, service);
      setSvcForm({ id: null, name: "", price: "", duration: "60" });
      await reloadServices();
      setDataError("");
    } catch (requestError) {
      setDataError(requestError.message);
    }
  };

  // дни недели
  const daysOfWeek = [
    { key: "Mon", label: KEY_TO_RU.Mon },
    { key: "Tue", label: KEY_TO_RU.Tue },
    { key: "Wed", label: KEY_TO_RU.Wed },
    { key: "Thu", label: KEY_TO_RU.Thu },
    { key: "Fri", label: KEY_TO_RU.Fri },
    { key: "Sat", label: KEY_TO_RU.Sat },
    { key: "Sun", label: KEY_TO_RU.Sun },
  ];
  const toggleWorkDay = (barberId, dayKeyOrRu) => {
    const key = VALID_KEYS.has(dayKeyOrRu)
      ? dayKeyOrRu
      : RU_TO_KEY[dayKeyOrRu] || dayKeyOrRu;
    const cur = schedules[barberId] || {
      barberId,
      workDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: "10:00",
      endTime: "21:00",
    };
    const set = new Set(cur.workDays || []);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    updateScheduleFor(barberId, { workDays: Array.from(set) });
  };
  const setStartFor = (barberId, val) =>
    updateScheduleFor(barberId, { startTime: normalizeTime(val) || "10:00" });
  const setEndFor = (barberId, val) =>
    updateScheduleFor(barberId, { endTime: normalizeTime(val) || "21:00" });

  // render
  if (!authorized) {
    return (
      <main className={styles.container}>
        <section className={styles.loginBox}>
          <div className={styles.loginBrand}>
            <span className={styles.brandMark}>С</span>
            <p className={styles.eyebrow}>Стиль & Красота</p>
          </div>
          <h1
            className={styles.title}
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            Вход в админ-панель
          </h1>
          <p className={styles.loginHint}>
            Введите данные администратора, чтобы продолжить работу.
          </p>
          <form className={styles.loginForm} onSubmit={submitPass}>
            <label className={styles.label}>Логин администратора</label>
            <input
              type="text"
              className={`${styles.input} ${error ? styles.inputError : ""}`}
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
            <label className={styles.label}>Пароль администратора</label>
            <input
              type="password"
              className={`${styles.input} ${error ? styles.inputError : ""}`}
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="Введите пароль"
              autoComplete="current-password"
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <button className={styles.btn} type="submit">
                Войти
              </button>
              {/* кнопка выхода со страницы входа */}
              <button
                className={styles.btnDanger}
                type="button"
                onClick={logout}
                title="Выйти и вернуться на сайт"
              >
                Выйти
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>Стиль & Красота</p>
          <h1
            className={styles.title}
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            Панель администратора
          </h1>
        </div>

        <div className={styles.tabRow}>
          <button
            className={`${styles.tabBtn} ${tab === "records" ? styles.activeTab : ""}`}
            onClick={() => setTab("records")}
          >
            Записи
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "inbox" ? styles.activeTab : ""}`}
            onClick={() => setTab("inbox")}
          >
            Входящие
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "services" ? styles.activeTab : ""}`}
            onClick={() => setTab("services")}
          >
            Услуги
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "schedules" ? styles.activeTab : ""}`}
            onClick={() => setTab("schedules")}
          >
            Расписания
          </button>
        </div>

        <div className={styles.headerActions}>
          <input
            className={styles.search}
            placeholder="Поиск: клиент, парикмахер, услуга, дата…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.btn} onClick={logout}>
            Выйти
          </button>
          <button className={styles.btnDanger} onClick={clearAll}>
            Очистить всё
          </button>
        </div>
      </header>

      <section className={styles.content}>
        {dataError && (
          <p role="alert" className={styles.error}>
            Ошибка API: {dataError}
          </p>
        )}
        <div className={styles.statsGrid}>
          {appointmentStats.map((stat) => (
            <article
              key={stat.label}
              className={`${styles.statCard} ${stat.style}`}
            >
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>
        {tab === "records" && (
          <section className={styles.list}>
            <div className={styles.filterBar}>
              <label className={styles.filterField}>
                <span>Статус</span>
                <select
                  className={styles.input}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">В ожидании</option>
                  <option value="confirmed">Подтверждено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </label>
              <label className={styles.filterField}>
                <span>Дата записи</span>
                <input
                  className={styles.input}
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </label>
              {(statusFilter !== "all" || dateFilter) && (
                <button
                  className={styles.filterReset}
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setDateFilter("");
                  }}
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
            <p className={styles.noteSmall}>
              Заявки клиентов · {filtered.length} из {items.length}
            </p>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <p>Нет записей.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.rowTop}>
                    <div className={styles.kv}>
                      {item.dateStr && (
                        <div className={styles.tag}>{item.dateStr}</div>
                      )}
                      {item.timeStr && (
                        <div className={styles.tag}>{item.timeStr}</div>
                      )}
                      <div
                        className={`${styles.statusTag} ${item.status === "confirmed" ? styles.statusConfirmed : item.status === "cancelled" ? styles.statusCancelled : styles.statusPending}`}
                      >
                        {item.status === "confirmed"
                          ? "Подтверждено"
                          : item.status === "cancelled"
                            ? "Отменено"
                            : "В ожидании"}
                      </div>
                    </div>
                    <div className={styles.mainInfo}>
                      <div className={styles.line}>
                        <span className={styles.label}>Клиент:</span>
                        <span className={styles.value}>{item.name || "-"}</span>
                      </div>
                      <div className={styles.line}>
                        <span className={styles.label}>Телефон:</span>
                        <a
                          className={styles.phoneLink}
                          href={`tel:${(item.phone || "").replace(/[^\d+]/g, "")}`}
                        >
                          {item.phone || "-"}
                        </a>
                      </div>
                      <div className={styles.line}>
                        <span className={styles.label}>Парикмахер:</span>
                        <span className={styles.value}>
                          {item.barberName || "-"}
                        </span>
                      </div>
                      <div className={styles.line}>
                        <span className={styles.label}>Услуга:</span>
                        <span className={styles.value}>
                          {item.serviceName || "-"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.priceBox}>
                      <div className={styles.price}>
                        {item.totalPrice ? `${item.totalPrice} ₽` : "-"}
                      </div>
                    </div>
                  </div>

                  <label className={styles.statusControl}>
                    <span className={styles.label}>Статус заявки</span>
                    <select
                      className={styles.input}
                      value={item.status || "new"}
                      onChange={(e) => setStatus(item.id, e.target.value)}
                    >
                      <option value="new">В ожидании</option>
                      <option value="confirmed">Подтверждено</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </label>

                  <div className={styles.noteRow}>
                    <label className={styles.noteLabel}>Заметка</label>
                    <textarea
                      className={styles.note}
                      rows={2}
                      value={item.note || ""}
                      onChange={(e) => updateNote(item.id, e.target.value)}
                      onBlur={(e) => saveNote(item.id, e.target.value)}
                    />
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={styles.btn}
                      onClick={() => setStatus(item.id, "confirmed")}
                    >
                      Подтвердить
                    </button>
                    <button
                      className={styles.btn}
                      onClick={() => markDone(item.id)}
                    >
                      Услуга оказана
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => removeItem(item.id)}
                    >
                      Отменить
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {tab === "inbox" && (
          <section className={styles.list}>
            <p className={styles.noteSmall}>
              Входящие — новые заявки. Подтвердите или отмените.
            </p>
            {items.filter(
              (i) => !i.status || i.status === "new" || i.status === "pending",
            ).length === 0 ? (
              <div className={styles.empty}>
                <p>Нет входящих заявок.</p>
              </div>
            ) : (
              items
                .filter(
                  (i) =>
                    !i.status || i.status === "new" || i.status === "pending",
                )
                .map((item) => (
                  <article key={item.id} className={styles.card}>
                    <div className={styles.rowTop}>
                      <div className={styles.kv}>
                        {item.dateStr && (
                          <div className={styles.tag}>{item.dateStr}</div>
                        )}
                        {item.timeStr && (
                          <div className={styles.tag}>{item.timeStr}</div>
                        )}
                      </div>
                      <div className={styles.mainInfo}>
                        <div className={styles.line}>
                          <span className={styles.label}>Клиент:</span>
                          <span className={styles.value}>{item.name}</span>
                        </div>
                        <div className={styles.line}>
                          <span className={styles.label}>Телефон:</span>
                          <a
                            className={styles.phoneLink}
                            href={`tel:${(item.phone || "").replace(/[^\d+]/g, "")}`}
                          >
                            {item.phone || "-"}
                          </a>
                        </div>
                        <div className={styles.line}>
                          <span className={styles.label}>Парикмахер:</span>
                          <span className={styles.value}>
                            {item.barberName}
                          </span>
                        </div>
                        <div className={styles.line}>
                          <span className={styles.label}>Услуга:</span>
                          <span className={styles.value}>
                            {item.serviceName}
                          </span>
                        </div>
                      </div>
                      <div className={styles.priceBox}>
                        <div className={styles.price}>
                          {item.totalPrice ? `${item.totalPrice} ₽` : "-"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button
                        className={styles.btn}
                        onClick={() => setStatus(item.id, "confirmed")}
                      >
                        Подтвердить
                      </button>
                      <button
                        className={styles.btnDanger}
                        onClick={() => setStatus(item.id, "cancelled")}
                      >
                        Отклонить
                      </button>
                    </div>
                  </article>
                ))
            )}
          </section>
        )}

        {tab === "services" && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Услуги</h2>
              <button className={styles.btn} onClick={startAddService}>
                Добавить услугу
              </button>
            </div>

            <form className={styles.serviceForm} onSubmit={submitServiceForm}>
              <input
                placeholder="Название"
                value={svcForm.name}
                onChange={(e) =>
                  setSvcForm({ ...svcForm, name: e.target.value })
                }
                className={styles.input}
              />
              <input
                type="number"
                placeholder="Цена"
                value={svcForm.price}
                onChange={(e) =>
                  setSvcForm({ ...svcForm, price: e.target.value })
                }
                className={styles.input}
                min="0"
                step="1"
              />
              <input
                type="number"
                placeholder="Длительность, мин"
                value={svcForm.duration}
                onChange={(e) =>
                  setSvcForm({ ...svcForm, duration: e.target.value })
                }
                className={styles.input}
                min="1"
                step="1"
              />
              <div className={styles.actions}>
                <button className={styles.btn} type="submit">
                  {svcForm.id ? "Сохранить" : "Добавить"}
                </button>
                {svcForm.id && (
                  <button
                    className={styles.btnDanger}
                    type="button"
                    onClick={() =>
                      setSvcForm({
                        id: null,
                        name: "",
                        price: "",
                        duration: "60",
                      })
                    }
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>

            <div className={styles.servicesList}>
              {services.length === 0 ? (
                <div className={styles.empty}>
                  <p>Список услуг пуст.</p>
                </div>
              ) : (
                services.map((s) => (
                  <div key={s.id} className={styles.serviceRow}>
                    <div>
                      <div className={styles.value}>{s.name}</div>
                      <div className={styles.label}>{s.price} ₽</div>
                      <div className={styles.label}>{s.duration} мин</div>
                    </div>
                    <div className={styles.serviceActions}>
                      <button
                        className={styles.btn}
                        onClick={() => startEditService(s)}
                      >
                        Изменить
                      </button>
                      <button
                        className={styles.btnDanger}
                        onClick={() => deleteService(s.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === "schedules" && (
          <section className={styles.panel}>
            <h2>Расписания мастеров</h2>
            <p className={styles.noteSmall}>
              По умолчанию доступны все дни с 10:00. Слоты ограничены графиком
              салона: будни до 21:00, выходные до 20:00.
            </p>
            <div className={styles.schedulesList}>
              {barbers.map((b) => {
                const cur = schedules[b.id] || {
                  barberId: b.id,
                  workDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                  startTime: "10:00",
                  endTime: "21:00",
                };
                return (
                  <div key={b.id} className={styles.scheduleCard}>
                    <div className={styles.rowTop}>
                      <div className={styles.mainInfo}>
                        <div className={styles.line}>
                          <span className={styles.label}>Мастер:</span>
                          <span className={styles.value}>{b.name}</span>
                        </div>
                        <div className={styles.line}>
                          <span className={styles.label}>Рабочие дни:</span>
                          <div className={styles.daysRow}>
                            {daysOfWeek.map((d) => (
                              <button
                                key={d.key}
                                type="button"
                                className={`${styles.dayBtn} ${cur.workDays?.includes(d.key) ? styles.dayActive : styles.dayInactive}`}
                                onClick={() => toggleWorkDay(b.id, d.key)}
                                aria-pressed={cur.workDays?.includes(d.key)}
                                title={d.label}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className={styles.line}>
                          <span className={styles.label}>Начало:</span>
                          <TimeInput
                            className={styles.input}
                            placeholder="10:00"
                            value={cur.startTime || ""}
                            onChange={(v) => setStartFor(b.id, v)}
                          />
                        </div>
                        <div className={styles.line}>
                          <span className={styles.label}>Конец:</span>
                          <TimeInput
                            className={styles.input}
                            placeholder="21:00"
                            value={cur.endTime || ""}
                            onChange={(v) => setEndFor(b.id, v)}
                          />
                        </div>
                      </div>
                      <div className={styles.priceBox}>
                        <div className={styles.priceSmall}>
                          {formatHours(cur.startTime, cur.endTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.actions}>
              <button
                className={styles.btn}
                onClick={() => saveSchedules(schedules)}
              >
                Сохранить все
              </button>
            </div>
          </section>
        )}
      </section>

      {toast && <div className={styles.toast}>{toast}</div>}
    </main>
  );
}

function formatHours(start, end) {
  const s = start || "";
  const e = end || "";
  if (!s && !e) return "часы не заданы";
  if (s && e) return `${s}–${e}`;
  return s ? `${s}–?` : `?–${e}`;
}
