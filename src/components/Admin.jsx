import React, { useEffect, useMemo, useState } from 'react';
import styles from '../styles/Admin.module.css';
import { getMasters } from '../utils/api';

const APPT_KEY = 'simple_appointments';
const SERVICES_KEY = 'simple_services';
const SCHEDULES_KEY = 'simple_schedules';

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
const RU_TO_KEY = { 'Пн':'Mon','Вт':'Tue','Ср':'Wed','Чт':'Thu','Пт':'Fri','Сб':'Sat','Вс':'Sun' };
const KEY_TO_RU = { Mon:'Пн', Tue:'Вт', Wed:'Ср', Thu:'Чт', Fri:'Пт', Sat:'Сб', Sun:'Вс' };
const VALID_KEYS = new Set(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);

// вспомогательное для времени
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function toHHMM(h, m) {
  const hh = String(clamp(h, 0, 23)).padStart(2, '0');
  const mm = String(clamp(m, 0, 59)).padStart(2, '0');
  return `${hh}:${mm}`;
}
function parseHHMM(str) {
  const m = String(str).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return { h: clamp(Number(m[1]) || 0, 0, 23), m: clamp(Number(m[2]) || 0, 0, 59) };
}
function normalizeTime(t) {
  const m = String(t).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return '';
  const hh = clamp(Number(m[1]) || 0, 0, 23);
  const mm = clamp(Number(m[2]) || 0, 0, 59);
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

// нормализация расписания
function normalizeSchedule(s) {
  const rawDays = Array.isArray(s.workDays) ? s.workDays : [];
  const dayKeys = rawDays
    .map(d => (VALID_KEYS.has(d) ? d : RU_TO_KEY[d] || null))
    .filter(Boolean);
  const uniqueDays = Array.from(new Set(dayKeys)).filter(k => VALID_KEYS.has(k));
  const start = normalizeTime(s.startTime || '09:00') || '09:00';
  const end = normalizeTime(s.endTime || '18:00') || '18:00';
  return { barberId: s.barberId, workDays: uniqueDays, startTime: start, endTime: end };
}

// компонент ввода времени
function TimeInput({ value, onChange, placeholder = '00:00', className }) {
  const [text, setText] = useState(value || '');

  useEffect(() => { setText(value || ''); }, [value]);

  const commit = (raw) => {
    const norm = normalizeTime(raw) || '';
    setText(norm);
    onChange?.(norm);
  };

  const handleInput = (e) => {
    let v = e.target.value.replace(/[^\d:]/g, '');
    if (/^\d{3,}$/.test(v)) v = v.slice(0, 4);
    if (/^\d{2}$/.test(v)) v = v + ':';
    const parts = v.split(':');
    const hh = parts[0]?.slice(0, 2) || '';
    const mm = (parts[1] || '').slice(0, 2);
    v = parts.length > 1 ? `${hh}:${mm}` : hh;
    setText(v);
  };

  const handleBlur = () => commit(text);

  const handleKeyDown = (e) => {
    const cur = parseHHMM(text) || parseHHMM(value) || { h: 0, m: 0 };
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.ctrlKey ? 10 : 1;
      let h = cur.h;
      let m = cur.m;
      if (e.key === 'ArrowUp') {
        if (e.shiftKey) h = (h + 1) % 24;
        else {
          m += step;
          while (m > 59) { m -= 60; h = (h + 1) % 24; }
        }
      } else {
        if (e.shiftKey) h = (h - 1 + 24) % 24;
        else {
          m -= step;
          while (m < 0) { m += 60; h = (h - 1 + 24) % 24; }
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

// базовые услуги
const DEFAULT_SERVICES = [
  { id: 1, name: 'Стрижка', price: 1500 },
  { id: 2, name: 'Окрашивание', price: 3000 },
  { id: 3, name: 'Укладка', price: 1200 },
  { id: 4, name: 'Визаж', price: 2000 },
];

export default function Admin() {
  const navigate = (path = '/') => { window.location.href = path; };

  // мастера
  const [barbers, setBarbers] = useState([]);
  useEffect(() => {
    let mounted = true;
    getMasters().then(list => { if (mounted) setBarbers(list || []); });
    return () => { mounted = false; };
  }, []);

  const [tab, setTab] = useState('records');
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [query, setQuery] = useState('');

  // toast
  const [toast, setToast] = useState('');

  // auth
  const [passInput, setPassInput] = useState('');
  const expectedPass = process.env.REACT_APP_ADMIN_PASS || 'admin123';
  const [authorized, setAuthorized] = useState(sessionStorage.getItem('admin_ok') === '1');
  const [error, setError] = useState('');

  // загрузка данных после авторизации
  useEffect(() => {
    if (!authorized) return;

    setItems(readJSON(APPT_KEY));

    const loadedServices = readJSON(SERVICES_KEY);
    if (!Array.isArray(loadedServices) || loadedServices.length === 0) {
      writeJSON(SERVICES_KEY, DEFAULT_SERVICES);
      setServices(DEFAULT_SERVICES);
    } else {
      const cleaned = loadedServices.map(s => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
      }));
      setServices(cleaned);
      writeJSON(SERVICES_KEY, cleaned);
    }

    const arr = readJSON(SCHEDULES_KEY);
    const obj = {};
    (Array.isArray(arr) ? arr : []).forEach(s => {
      const ns = normalizeSchedule(s);
      if (ns.barberId != null) obj[ns.barberId] = ns;
    });
    for (const b of barbers) {
      if (!obj[b.id]) {
        obj[b.id] = { barberId: b.id, workDays: [], startTime: '09:00', endTime: '18:00' };
      }
    }
    setSchedules(obj);
    writeJSON(SCHEDULES_KEY, Object.values(obj));
  }, [authorized, barbers]);

  // sync по storage
  useEffect(() => {
    const onStorage = (e) => {
      if (!authorized) return;
      if (e.key === APPT_KEY) setItems(readJSON(APPT_KEY));
      if (e.key === SERVICES_KEY) setServices(readJSON(SERVICES_KEY));
      if (e.key === SCHEDULES_KEY) {
        const arr = readJSON(SCHEDULES_KEY);
        const obj = {};
        (Array.isArray(arr) ? arr : []).forEach(s => {
          const ns = normalizeSchedule(s);
          if (ns.barberId != null) obj[ns.barberId] = ns;
        });
        setSchedules(obj);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [authorized]);

  // вход/выход
  const submitPass = (e) => {
    e && e.preventDefault();
    if (passInput === expectedPass) {
      sessionStorage.setItem('admin_ok', '1');
      setAuthorized(true);
      setError('');
      setPassInput('');
    } else {
      setError('Неверный пароль');
    }
  };
  const logout = () => {
    sessionStorage.removeItem('admin_ok');
    setAuthorized(false);
    setItems([]);
    setServices([]);
    setSchedules({});
    setQuery('');
    setPassInput('');
    setError('');
    navigate('/');
  };

  // фильтр записей
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(x =>
      (x.name || '').toLowerCase().includes(q) ||
      (x.barberName || '').toLowerCase().includes(q) ||
      (x.serviceName || '').toLowerCase().includes(q) ||
      (x.dateStr || '').toLowerCase().includes(q) ||
      (x.timeStr || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  // записи
  const removeItem = (id) => {
    const list = items.filter(x => x.id !== id);
    setItems(list);
    writeJSON(APPT_KEY, list);
  };
  const markDone = (id) => {
    // можно спросить подтверждение:
    // if (!window.confirm('Удалить запись как выполненную?')) return;
    removeItem(id);
  };
  const updateNote = (id, note) => {
    const list = items.map(x => x.id === id ? { ...x, note } : x);
    setItems(list);
    writeJSON(APPT_KEY, list);
  };
  const setStatus = (id, status) => {
    const list = items.map(x => x.id === id ? { ...x, status } : x);
    setItems(list);
    writeJSON(APPT_KEY, list);
  };
  const clearAll = () => {
    if (!window.confirm('Удалить все записи?')) return;
    localStorage.removeItem(APPT_KEY);
    setItems([]);
  };

  // услуги
  const reloadServices = () => setServices(readJSON(SERVICES_KEY));
  const addService = (svc) => {
    const normalized = { ...svc, price: Number(svc.price) };
    const list = [...services, normalized].sort((a, b) => a.name.localeCompare(b.name));
    setServices(list);
    writeJSON(SERVICES_KEY, list);
  };
  const updateService = (id, patch) => {
    const normalizedPatch = { ...patch, price: patch.price != null ? Number(patch.price) : undefined };
    const list = services
      .map(s => s.id === id ? { ...s, ...normalizedPatch } : s)
      .sort((a, b) => a.name.localeCompare(b.name));
    setServices(list);
    writeJSON(SERVICES_KEY, list);
  };
  const deleteService = (id) => {
    if (!window.confirm('Удалить услугу?')) return;
    const list = services.filter(s => s.id !== id);
    setServices(list);
    writeJSON(SERVICES_KEY, list);
  };

  // расписания
  const saveSchedules = (obj) => {
    setSchedules(obj);
    writeJSON(SCHEDULES_KEY, Object.values(obj));
    setToast('Расписания сохранены');
    clearTimeout(window.__admin_toast_timer);
    window.__admin_toast_timer = setTimeout(() => setToast(''), 2500);
  };
  const updateScheduleFor = (barberId, patch) => {
    const cur = schedules[barberId] || { barberId, workDays: [], startTime: '09:00', endTime: '18:00' };
    const next = normalizeSchedule({ ...cur, ...patch, barberId });
    const obj = { ...schedules, [barberId]: next };
    saveSchedules(obj);
  };

  // форма услуг
  const [svcForm, setSvcForm] = useState({ id: null, name: '', price: '' });
  const startAddService = () => setSvcForm({ id: null, name: '', price: '' });
  const startEditService = (s) => setSvcForm({ id: s.id, name: s.name || '', price: String(s.price ?? '') });
  const submitServiceForm = (e) => {
    e.preventDefault();
    const name = (svcForm.name || '').trim();
    const price = Number(svcForm.price);
    if (!name) return;
    if (!Number.isFinite(price) || price < 0) return;

    if (svcForm.id == null) addService({ id: Date.now(), name, price });
    else updateService(svcForm.id, { name, price });

    setSvcForm({ id: null, name: '', price: '' });
    reloadServices();
  };

  // дни недели
  const daysOfWeek = [
    { key: 'Mon', label: KEY_TO_RU.Mon },
    { key: 'Tue', label: KEY_TO_RU.Tue },
    { key: 'Wed', label: KEY_TO_RU.Wed },
    { key: 'Thu', label: KEY_TO_RU.Thu },
    { key: 'Fri', label: KEY_TO_RU.Fri },
    { key: 'Sat', label: KEY_TO_RU.Sat },
    { key: 'Sun', label: KEY_TO_RU.Sun },
  ];
  const toggleWorkDay = (barberId, dayKeyOrRu) => {
    const key = VALID_KEYS.has(dayKeyOrRu) ? dayKeyOrRu : (RU_TO_KEY[dayKeyOrRu] || dayKeyOrRu);
    const cur = schedules[barberId] || { barberId, workDays: [], startTime: '09:00', endTime: '18:00' };
    const set = new Set(cur.workDays || []);
    if (set.has(key)) set.delete(key); else set.add(key);
    updateScheduleFor(barberId, { workDays: Array.from(set) });
  };
  const setStartFor = (barberId, val) => updateScheduleFor(barberId, { startTime: normalizeTime(val) || '09:00' });
  const setEndFor = (barberId, val) => updateScheduleFor(barberId, { endTime: normalizeTime(val) || '18:00' });

  // render
  if (!authorized) {
    return (
      <main className={styles.container}>
        <section className={styles.loginBox}>
          <h1 className={styles.title} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Вход в админ-панель</h1>
          <form className={styles.loginForm} onSubmit={submitPass}>
            <label className={styles.label}>Пароль администратора</label>
            <input
              type="password"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="Введите пароль"
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <button className={styles.btn} type="submit">Войти</button>
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
        <h1 className={styles.title} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Админ панель</h1>

        <div className={styles.tabRow}>
          <button className={`${styles.tabBtn} ${tab === 'records' ? styles.activeTab : ''}`} onClick={() => setTab('records')}>Записи</button>
          <button className={`${styles.tabBtn} ${tab === 'inbox' ? styles.activeTab : ''}`} onClick={() => setTab('inbox')}>Входящие</button>
          <button className={`${styles.tabBtn} ${tab === 'services' ? styles.activeTab : ''}`} onClick={() => setTab('services')}>Услуги</button>
          <button className={`${styles.tabBtn} ${tab === 'schedules' ? styles.activeTab : ''}`} onClick={() => setTab('schedules')}>Расписания</button>
        </div>

        <div className={styles.headerActions}>
          <input
            className={styles.search}
            placeholder="Поиск: клиент, парикмахер, услуга, дата…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.btn} onClick={logout}>Выйти</button>
          <button className={styles.btnDanger} onClick={clearAll}>Очистить всё</button>
        </div>
      </header>

      <section className={styles.content}>
        {tab === 'records' && (
          <section className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <p>Нет записей.</p>
              </div>
            ) : (
              filtered.map(item => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.rowTop}>
                    <div className={styles.kv}>
                      {item.dateStr && <div className={styles.tag}>{item.dateStr}</div>}
                      {item.timeStr && <div className={styles.tag}>{item.timeStr}</div>}
                      {item.status && <div className={styles.statusTag}>{item.status}</div>}
                    </div>
                    <div className={styles.mainInfo}>
                      <div className={styles.line}><span className={styles.label}>Клиент:</span><span className={styles.value}>{item.name || '-'}</span></div>
                      <div className={styles.line}><span className={styles.label}>Телефон:</span><span className={styles.value}>{item.phone || '-'}</span></div>
                      <div className={styles.line}><span className={styles.label}>Парикмахер:</span><span className={styles.value}>{item.barberName || '-'}</span></div>
                      <div className={styles.line}><span className={styles.label}>Услуга:</span><span className={styles.value}>{item.serviceName || '-'}</span></div>
                    </div>
                    <div className={styles.priceBox}><div className={styles.price}>{item.totalPrice ? `${item.totalPrice} ₽` : '-'}</div></div>
                  </div>

                  <div className={styles.noteRow}>
                    <label className={styles.noteLabel}>Заметка</label>
                    <textarea className={styles.note} rows={2} value={item.note || ''} onChange={(e) => updateNote(item.id, e.target.value)} />
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.btn} onClick={() => setStatus(item.id, 'confirmed')}>Подтвердить</button>
                    <button className={styles.btn} onClick={() => markDone(item.id)}>Услуга оказана</button>
                    <button className={styles.btnDanger} onClick={() => removeItem(item.id)}>Отменить</button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {tab === 'inbox' && (
          <section className={styles.list}>
            <p className={styles.noteSmall}>Входящие — новые заявки. Подтвердите или отмените.</p>
            {items.filter(i => !i.status || i.status === 'new').length === 0 ? (
              <div className={styles.empty}><p>Нет входящих заявок.</p></div>
            ) : (
              items.filter(i => !i.status || i.status === 'new').map(item => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.rowTop}>
                    <div className={styles.kv}>
                      {item.dateStr && <div className={styles.tag}>{item.dateStr}</div>}
                      {item.timeStr && <div className={styles.tag}>{item.timeStr}</div>}
                    </div>
                    <div className={styles.mainInfo}>
                      <div className={styles.line}><span className={styles.label}>Клиент:</span><span className={styles.value}>{item.name}</span></div>
                      <div className={styles.line}><span className={styles.label}>Телефон:</span><span className={styles.value}>{item.phone}</span></div>
                      <div className={styles.line}><span className={styles.label}>Парикмахер:</span><span className={styles.value}>{item.barberName}</span></div>
                      <div className={styles.line}><span className={styles.label}>Услуга:</span><span className={styles.value}>{item.serviceName}</span></div>
                    </div>
                    <div className={styles.priceBox}><div className={styles.price}>{item.totalPrice ? `${item.totalPrice} ₽` : '-'}</div></div>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.btn} onClick={() => setStatus(item.id, 'confirmed')}>Подтвердить</button>
                    <button className={styles.btnDanger} onClick={() => setStatus(item.id, 'cancelled')}>Отклонить</button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {tab === 'services' && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Услуги</h2>
              <button className={styles.btn} onClick={startAddService}>Добавить услугу</button>
            </div>

            <form className={styles.serviceForm} onSubmit={submitServiceForm}>
              <input
                placeholder="Название"
                value={svcForm.name}
                onChange={e => setSvcForm({ ...svcForm, name: e.target.value })}
                className={styles.input}
              />
              <input
                type="number"
                placeholder="Цена"
                value={svcForm.price}
                onChange={e => setSvcForm({ ...svcForm, price: e.target.value })}
                className={styles.input}
                min="0"
                step="1"
              />
              <div className={styles.actions}>
                <button className={styles.btn} type="submit">{svcForm.id ? 'Сохранить' : 'Добавить'}</button>
                {svcForm.id && (
                  <button
                    className={styles.btnDanger}
                    type="button"
                    onClick={() => setSvcForm({ id: null, name: '', price: '' })}
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>

            <div className={styles.servicesList}>
              {services.length === 0 ? (
                <div className={styles.empty}><p>Список услуг пуст.</p></div>
              ) : (
                services.map(s => (
                  <div key={s.id} className={styles.serviceRow}>
                    <div>
                      <div className={styles.value}>{s.name}</div>
                      <div className={styles.label}>{s.price} ₽</div>
                    </div>
                    <div className={styles.serviceActions}>
                      <button className={styles.btn} onClick={() => startEditService(s)}>Изменить</button>
                      <button className={styles.btnDanger} onClick={() => deleteService(s.id)}>Удалить</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === 'schedules' && (
          <section className={styles.panel}>
            <h2>Расписания мастеров</h2>
            <p className={styles.noteSmall}>Отметьте рабочие дни и рабочее время</p>
            <div className={styles.schedulesList}>
              {barbers.map(b => {
                const cur = schedules[b.id] || { barberId: b.id, workDays: [], startTime: '09:00', endTime: '18:00' };
                return (
                  <div key={b.id} className={styles.scheduleCard}>
                    <div className={styles.rowTop}>
                      <div className={styles.mainInfo}>
                        <div className={styles.line}><span className={styles.label}>Мастер:</span><span className={styles.value}>{b.name}</span></div>
                        <div className={styles.line}><span className={styles.label}>Рабочие дни:</span>
                          <div className={styles.daysRow}>
                            {daysOfWeek.map(d => (
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
                            placeholder="09:00"
                            value={cur.startTime || ''}
                            onChange={(v) => setStartFor(b.id, v)}
                          />
                        </div>
                        <div className={styles.line}>
                          <span className={styles.label}>Конец:</span>
                          <TimeInput
                            className={styles.input}
                            placeholder="18:00"
                            value={cur.endTime || ''}
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
              <button className={styles.btn} onClick={() => saveSchedules(schedules)}>Сохранить все</button>
            </div>
          </section>
        )}
      </section>

      {toast && <div className={styles.toast}>{toast}</div>}
    </main>
  );
}

function formatHours(start, end) {
  const s = start || '';
  const e = end || '';
  if (!s && !e) return 'часы не заданы';
  if (s && e) return `${s}–${e}`;
  return s ? `${s}–?` : `?–${e}`; 
}