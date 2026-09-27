import { defineStore } from "pinia";
import { computed, ref } from "vue";
import api from "@/services/api";
import { extractListFromApi, fetchAllPaginated } from "@/utils/apiPagination";

function instanteDisponibilidad(value) {
  const fecha = String(value || "").trim().replace(" ", "T");
  if (!fecha) return NaN;
  const fechaHora = /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T00:00:00` : fecha;
  // Backend: America/El_Salvador (UTC-06). Respetar la zona de los datetime serializados por Laravel.
  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(fechaHora);
  return Date.parse(tieneZona ? fechaHora : `${fechaHora}-06:00`);
}

export const useReservasStore = defineStore("reservas", () => {
  const reservas = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const advertencia = ref(null);
  const incidenciasPendientes = ref([]);
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });

  const total = computed(() => pagination.value.total || reservas.value.length);

  function normalizePagination(payload) {
    if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
      return {
        current_page: 1,
        last_page: 1,
        per_page: reservas.value.length || 10,
        total: reservas.value.length,
        from: reservas.value.length ? 1 : 0,
        to: reservas.value.length,
      };
    }

    return {
      current_page: Number(payload.current_page || 1),
      last_page: Number(payload.last_page || 1),
      per_page: Number(payload.per_page || 10),
      total: Number(payload.total || 0),
      from: Number(payload.from || 0),
      to: Number(payload.to || 0),
    };
  }

  async function fetchReservas(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get("/admin/reservas", { params });
      const payload = res.data?.data;
      reservas.value = extractListFromApi(res.data);
      pagination.value = normalizePagination(payload);
    } catch {
      error.value = "Error al cargar reservas.";
      reservas.value = [];
      pagination.value = normalizePagination(null);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Listado sin reservas CANCELADAS con paginación calculada en el frontend.
   * Laravel no permite excluir canceladas en /admin/reservas; si se ocultaban
   * después de paginar en el servidor, cada página mostraba menos filas y el
   * total ("de N reservas") seguía contando las canceladas.
   */
  async function fetchReservasSinCanceladas(params = {}, page = 1, perPage = 10) {
    loading.value = true;
    error.value = null;
    try {
      const filtros = { ...params };
      delete filtros.page;
      const { items } = await fetchAllPaginated(
        (requestParams) => api.get("/admin/reservas", { params: requestParams }),
        filtros,
      );
      const visibles = items.filter((reserva) => reserva.estado !== "CANCELADA");
      const total = visibles.length;
      const lastPage = Math.max(1, Math.ceil(total / perPage));
      const actual = Math.min(Math.max(1, Number(page) || 1), lastPage);
      const inicio = (actual - 1) * perPage;
      reservas.value = visibles.slice(inicio, inicio + perPage);
      pagination.value = {
        current_page: actual,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: total ? inicio + 1 : 0,
        to: inicio + reservas.value.length,
      };
    } catch {
      error.value = "Error al cargar reservas.";
      reservas.value = [];
      pagination.value = normalizePagination(null);
    } finally {
      loading.value = false;
    }
  }

  async function crear(form) {
    loading.value = true;
    error.value = null;
    advertencia.value = null;
    incidenciasPendientes.value = [];
    try {
      const res = await api.post("/admin/reservas", form);
      advertencia.value = res.data?.advertencia || null;
      incidenciasPendientes.value = res.data?.incidencias_pendientes || [];
      reservas.value.unshift(res.data.data);
      return res.data.data;
    } catch (e) {
      const errs = e.response?.data?.errors;
      const firstErr = errs && typeof errs === "object" ? Object.values(errs).flat()[0] : null;
      error.value = firstErr || e.response?.data?.message || "Error al crear la reserva.";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchVehiculosDisponibles(fechaInicio, fechaFin, reservaId = null) {
    if (!fechaInicio || !fechaFin) return [];
    try {
      const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin, estado: "DISPONIBLE" };
      if (reservaId) params.reserva_id = reservaId;
      const { items } = await fetchAllPaginated(
        (requestParams) => api.get("/admin/vehiculos", { params: requestParams }),
        params,
      );
      return items.filter((vehiculo) => vehiculo.estado === "DISPONIBLE");
    } catch (e) {
      if (e.response?.status === 404) return [];
      throw e;
    }
  }

  async function fetchVehiculosDisponiblesParaReserva(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return [];
    const inicio = instanteDisponibilidad(fechaInicio);
    const fin = instanteDisponibilidad(fechaFin);
    if (!Number.isFinite(inicio) || !Number.isFinite(fin)) {
      throw new Error("No se pudo comprobar la disponibilidad para las fechas seleccionadas.");
    }
    const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
    const [vehiculos, contratos] = await Promise.allSettled([
      fetchAllPaginated(
        (requestParams) => api.get("/admin/vehiculos", { params: requestParams }),
        params,
      ),
      fetchAllPaginated(
        (requestParams) => api.get("/admin/contratos", { params: requestParams }),
        { estado: "ACTIVO" },
      ),
    ]);
    if (contratos.status === "rejected") {
      throw new Error("No se pudieron consultar los contratos activos para comprobar la disponibilidad. Cambia o vuelve a seleccionar las fechas para reintentar.", { cause: contratos.reason });
    }
    if (vehiculos.status === "rejected") {
      if (vehiculos.reason.response?.status === 404) return [];
      throw vehiculos.reason;
    }
    const ocupados = new Set();
    for (const contrato of contratos.value.items) {
      if (contrato.estado_contrato !== "ACTIVO") continue;
      const entrega = instanteDisponibilidad(contrato.fecha_hora_entrega);
      const devolucion = instanteDisponibilidad(contrato.fecha_hora_devolucion);
      const vehiculoId = Number(contrato.vehiculo_id ?? contrato.vehiculo?.id);
      if (!vehiculoId || !Number.isFinite(entrega) || !Number.isFinite(devolucion)) {
        throw new Error("No se pudo comprobar la disponibilidad: hay contratos activos con datos de vehículo o fechas incompletos.");
      }
      if (entrega < fin && devolucion > inicio) ocupados.add(vehiculoId);
    }
    return vehiculos.value.items.filter((vehiculo) =>
      ["DISPONIBLE", "RENTADO"].includes(vehiculo.estado) && !ocupados.has(Number(vehiculo.id)),
    );
  }

  async function fetchReserva(id) {
    const res = await api.get(`/admin/reservas/${id}`);
    return res.data.data;
  }

  async function actualizar(id, form) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.put(`/admin/reservas/${id}`, form);
      const actualizada = res.data.data;
      const idx = reservas.value.findIndex((r) => r.id === id);
      if (idx !== -1) reservas.value[idx] = actualizada;
      return actualizada;
    } catch (e) {
      const errs = e.response?.data?.errors;
      const firstErr = errs && typeof errs === "object" ? Object.values(errs).flat()[0] : null;
      error.value = firstErr || e.response?.data?.message || "Error al actualizar la reserva.";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchReservasCliente(cliente) {
    const clienteId = typeof cliente === "object" ? cliente?.id : cliente;
    const search = typeof cliente === "object"
      ? (cliente?.dui || cliente?.nombre || clienteId)
      : clienteId;

    const { items } = await fetchAllPaginated(
      (params) => api.get("/admin/reservas", { params }),
      { search },
    );
    return items.filter(
      (reserva) => Number(reserva.cliente_id || reserva.cliente?.id) === Number(clienteId),
    );
  }

  async function fetchReservasActivasCliente(cliente) {
    const items = await fetchReservasCliente(cliente);
    return items.filter((reserva) => reserva.estado === "PENDIENTE" && !reserva.contrato);
  }

  /**
   * Reservas PENDIENTE o CONFIRMADA del cliente: son las que Laravel revisa en
   * ContratoController::storeDirecto para rechazar un contrato directo con
   * fechas traslapadas.
   */
  async function fetchReservasVigentesCliente(cliente) {
    const items = await fetchReservasCliente(cliente);
    return items.filter((reserva) => ["PENDIENTE", "CONFIRMADA"].includes(reserva.estado));
  }

  async function cancelar(id, motivo) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post("/admin/cancelaciones", { reserva_id: id, motivo });
      const actualizada = res.data?.data?.reserva || res.data?.data;
      const idx = reservas.value.findIndex((r) => r.id === id);
      if (idx !== -1 && actualizada?.id) reservas.value[idx] = actualizada;
      return actualizada;
    } catch (e) {
      const errs = e.response?.data?.errors;
      const firstErr = errs && typeof errs === "object" ? Object.values(errs).flat()[0] : null;
      error.value = firstErr || e.response?.data?.message || "Error al cancelar la reserva.";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCancelaciones(params = {}) {
    const { items } = await fetchAllPaginated(
      (requestParams) => api.get("/admin/cancelaciones", { params: requestParams }),
      params,
    );
    return items;
  }

  return {
    reservas,
    loading,
    error,
    pagination,
    total,
    fetchReservas,
    fetchReservasSinCanceladas,
    fetchReserva,
    crear,
    actualizar,
    fetchVehiculosDisponibles,
    fetchVehiculosDisponiblesParaReserva,
    fetchReservasActivasCliente,
    fetchReservasVigentesCliente,
    cancelar,
    fetchCancelaciones,
    advertencia,
    incidenciasPendientes,
  };
});
