async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 204) return null;

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    if (response.ok) {
      throw new Error("Сервер вернул ответ в неподдерживаемом формате");
    }
    data = {};
  }
  if (!response.ok) {
    throw new Error(data.error || `Ошибка запроса (${response.status})`);
  }
  return data;
}

function expectArray(data, resource) {
  if (!Array.isArray(data)) {
    throw new Error(`Сервер вернул некорректный список: ${resource}`);
  }
  return data;
}

export const getMasters = async () =>
  expectArray(await request("/api/masters"), "мастера");
export const getServices = async () =>
  expectArray(await request("/api/services"), "услуги");
export const getAvailableSlots = async (masterId, date) =>
  expectArray(
    await request(
      `/api/masters/${masterId}/slots?date=${encodeURIComponent(date)}`,
    ),
    "время для записи",
  );
export const createAppointment = (appointment) =>
  request("/api/appointments", { method: "POST", body: appointment });

export const loginAdmin = (login, password) =>
  request("/api/auth/login", {
    method: "POST",
    body: { login, password },
  });
export const getAdminAppointments = async (token) =>
  expectArray(await request("/api/admin/appointments", { token }), "записи");
export const updateAdminAppointment = (token, id, updates) =>
  request(`/api/admin/appointments/${id}`, {
    method: "PATCH",
    token,
    body: updates,
  });
export const deleteAdminAppointment = (token, id) =>
  request(`/api/admin/appointments/${id}`, { method: "DELETE", token });
export const deleteAllAdminAppointments = (token) =>
  request("/api/admin/appointments", { method: "DELETE", token });

export const createAdminService = (token, service) =>
  request("/api/admin/services", { method: "POST", token, body: service });
export const updateAdminService = (token, id, service) =>
  request(`/api/admin/services/${id}`, {
    method: "PATCH",
    token,
    body: service,
  });
export const deleteAdminService = (token, id) =>
  request(`/api/admin/services/${id}`, { method: "DELETE", token });
