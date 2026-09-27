<template>
  <div class="min-h-screen" :class="isDark ? 'bg-gray-950' : 'bg-slate-100'">
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
      <div>
        <h1 class="text-2xl font-extrabold" :class="isDark ? 'text-gray-100' : 'text-gray-900'">
          Catálogo
        </h1>
        <p class="text-sm mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          {{ subtituloActivo }}
        </p>
      </div>

      <div v-if="puedeEscribirTab" class="w-full sm:w-auto flex-shrink-0">
        <button
          type="button"
          @click="accionNuevo"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-sm"
          style="background: #c0392b"
        >
          <i class="pi pi-plus text-sm"></i>
          {{ nuevoLabel }}
        </button>
      </div>
    </div>

    <!-- Barra de pestañas -->
    <div
      class="rounded-2xl border shadow-sm p-2 mb-4 overflow-x-auto"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    >
      <div class="flex gap-1 min-w-max">
        <button
          v-for="tab in tabsVisibles"
          :key="tab.value"
          type="button"
          @click="cambiarTab(tab.value)"
          class="catalogo-tab inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all"
          :class="
            activeTab === tab.value
              ? 'catalogo-tab-active'
              : isDark
                ? 'catalogo-tab-inactive-dark'
                : 'catalogo-tab-inactive-light'
          "
        >
          <span
            class="tab-icon-wrap w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            :style="estiloIconoTab(tab, activeTab === tab.value)"
          >
            <i :class="tab.icon" class="text-sm" />
          </span>
          <span>{{ tab.label }}</span>
          <span
            class="min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold leading-none inline-flex items-center justify-center"
            :class="
              activeTab === tab.value
                ? 'bg-white/25 text-white'
                : isDark
                  ? 'bg-gray-800 text-gray-400'
                  : 'bg-gray-100 text-gray-500'
            "
            >{{ conteoTab(tab.value) }}</span
          >
        </button>
      </div>
    </div>

    <!-- Buscador y filtros -->
    <div
      class="rounded-2xl border shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    >
      <div class="relative flex-1">
        <i
          class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
          :class="isDark ? 'text-[#f0a500]' : 'text-gray-400'"
        ></i>
        <input
          v-model="search"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white'"
        />
      </div>
      <select
        v-if="activeTab === 'vehiculos'"
        v-model="filtroEstado"
        class="px-4 py-2.5 rounded-xl border text-sm font-medium min-w-[160px]"
        :class="
          isDark
            ? 'border-gray-700 bg-gray-800 text-gray-200'
            : 'border-gray-300 bg-white text-gray-700'
        "
      >
        <option value="">Todos los estados</option>
        <option v-for="e in estadosFiltro" :key="e.value" :value="e.value">{{ e.label }}</option>
      </select>
    </div>

    <div
      v-if="activeTab === 'seguros' && proximoAVencer"
      class="rounded-2xl border p-4 mb-5 flex items-start gap-3"
      :class="
        seguroFechaVencida(proximoAVencer)
          ? isDark
            ? 'bg-red-950/30 border-red-900/60 text-red-200'
            : 'bg-red-50 border-red-200 text-red-800'
          : isDark
            ? 'bg-amber-950/30 border-amber-900/60 text-amber-200'
            : 'bg-amber-50 border-amber-200 text-amber-800'
      "
    >
      <i
        :class="seguroFechaVencida(proximoAVencer) ? 'pi pi-exclamation-triangle' : 'pi pi-clock'"
        class="mt-0.5"
      ></i>
      <div class="min-w-0">
        <p class="font-bold text-sm">
          {{
            seguroFechaVencida(proximoAVencer)
              ? "Seguro con fecha vencida"
              : "Próximo seguro a vencer"
          }}
        </p>
        <p class="text-xs mt-0.5 opacity-80">
          {{ resumenSeguro(proximoAVencer) }} ·
          {{ formatFechaSeguro(proximoAVencer.fecha_vencimiento) }}
        </p>
      </div>
    </div>

    <div
      v-if="activeTab === 'seguros' && segurosStore.error"
      class="rounded-2xl border p-4 mb-5 text-sm"
      :class="
        isDark
          ? 'bg-red-950/30 border-red-900/60 text-red-200'
          : 'bg-red-50 border-red-200 text-red-700'
      "
    >
      {{ mensajeErrorSeguroTexto(segurosStore.error) }}
    </div>

    <p v-if="!puedeEscribirTab" class="mb-4 text-xs" :class="isDark ? 'text-gray-400' : 'text-slate-500'">
      Solo consulta para tu rol
    </p>

    <!-- Tabla -->
    <div
      class="rounded-2xl border shadow-sm overflow-hidden"
      :class="isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    >
      <div
        v-if="isLoadingTab"
        class="flex items-center justify-center py-20 gap-2"
        :class="isDark ? 'text-gray-400' : 'text-slate-500'"
      >
        <i class="pi pi-spin pi-spinner"></i>
        <span class="text-sm">{{ loadingLabel }}</span>
      </div>

      <!-- Seguros en móvil: tarjetas legibles en lugar de una tabla de 1000px -->
      <div
        v-if="!isLoadingTab && activeTab === 'seguros'"
        class="md:hidden divide-y"
        :class="isDark ? 'divide-gray-800' : 'divide-gray-200'"
      >
        <article v-for="item in itemsVisibles" :key="`seguro-card-${item.id}`" class="p-4 space-y-3">
          <div class="flex items-start gap-3">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style="background: #1d4ed8"
            >
              <i class="pi pi-shield text-white text-sm"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold break-words" :class="isDark ? 'text-gray-100' : 'text-gray-800'">
                {{ nombreSeguroVehiculo(item) }}
              </p>
              <p class="text-xs break-words" :class="isDark ? 'text-gray-400' : 'text-slate-500'">
                {{ item.vehiculo?.placa || "Sin placa" }}
                <template v-if="item.vehiculo?.propietario?.nombre">
                  · {{ item.vehiculo.propietario.nombre }}
                </template>
              </p>
            </div>
            <span class="estado-badge flex-shrink-0" :class="estadoSeguroClase(item.estado)">
              {{ item.estado || "Sin estado" }}
            </span>
          </div>
          <dl class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
            <div>
              <dt class="font-semibold" :class="isDark ? 'text-gray-500' : 'text-slate-500'">Aseguradora</dt>
              <dd class="break-words">{{ item.aseguradora || "—" }}</dd>
            </div>
            <div>
              <dt class="font-semibold" :class="isDark ? 'text-gray-500' : 'text-slate-500'">N.º de póliza</dt>
              <dd class="break-words">{{ item.numero_poliza || "—" }}</dd>
            </div>
            <div>
              <dt class="font-semibold" :class="isDark ? 'text-gray-500' : 'text-slate-500'">Inicio</dt>
              <dd>{{ formatFechaSeguro(item.fecha_inicio) }}</dd>
            </div>
            <div>
              <dt class="font-semibold" :class="isDark ? 'text-gray-500' : 'text-slate-500'">Vence</dt>
              <dd :class="seguroFechaVencida(item) ? 'text-red-500 font-semibold' : ''">
                {{ formatFechaSeguro(item.fecha_vencimiento) }}
                <span v-if="seguroFechaVencida(item)"> (vencida)</span>
              </dd>
            </div>
            <div class="col-span-2">
              <dt class="font-semibold" :class="isDark ? 'text-gray-500' : 'text-slate-500'">Cobertura</dt>
              <dd class="break-words">{{ item.cobertura || "Sin cobertura descrita" }}</dd>
            </div>
          </dl>
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 py-2 rounded-lg border text-xs font-bold disabled:opacity-40"
              :class="isDark ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'"
              :disabled="seguroGuardando"
              @click="accionVerSeguro(item)"
            >
              <i class="pi pi-eye mr-1"></i> Ver
            </button>
            <button
              v-if="puedeGestionarSeguros"
              type="button"
              class="flex-1 py-2 rounded-lg border text-xs font-bold disabled:opacity-40"
              :class="isDark ? 'border-blue-800 bg-blue-950/40 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700'"
              :disabled="seguroGuardando"
              @click="accionEditarSeguro(item)"
            >
              <i class="pi pi-pencil mr-1"></i> Editar
            </button>
            <button
              v-if="puedeGestionarSeguros"
              type="button"
              class="flex-1 py-2 rounded-lg border text-xs font-bold disabled:opacity-40"
              :class="isDark ? 'border-red-800 bg-red-950/40 text-red-300' : 'border-red-200 bg-red-50 text-red-700'"
              :disabled="seguroGuardando"
              @click="accionAnularSeguro(item)"
            >
              <i class="pi pi-ban mr-1"></i> Anular
            </button>
          </div>
        </article>
        <p
          v-if="itemsFiltrados.length === 0"
          class="px-5 py-12 text-center font-medium"
          :class="isDark ? 'text-gray-400' : 'text-slate-500'"
        >
          {{ emptyLabel }}
        </p>
      </div>

      <div v-if="!isLoadingTab" class="overflow-x-auto" :class="activeTab === 'seguros' ? 'hidden md:block' : ''">
        <table
          class="w-full text-sm table-fixed catalogo-table"
          :class="
            activeTab === 'vehiculos' || activeTab === 'seguros'
              ? 'min-w-[1000px]'
              : 'min-w-[860px]'
          "
        >
          <thead>
            <tr
              :style="
                isDark
                  ? 'background:#111827; border-bottom:1px solid #1f2937;'
                  : 'background:#f1f5f9; border-bottom:1px solid #cbd5e1;'
              "
            >
              <th
                v-for="col in columnasActivas"
                :key="col.key"
                class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-r last:border-r-0"
                :class="isDark ? 'text-gray-400' : 'text-slate-500'"
                :style="{ width: col.width, borderRightColor: isDark ? '#1f2937' : '#e2e8f0' }"
              >
                {{ col.label }}
              </th>
              <th
                v-if="mostrarAcciones"
                class="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-right whitespace-nowrap"
                :class="isDark ? 'text-gray-400' : 'text-slate-500'"
                style="width: 96px"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody :key="activeTab">
            <tr
              v-for="(item, index) in itemsVisibles"
              :key="`${activeTab}-${item.id}-${index}`"
              class="border-b transition-colors"
              :class="
                isDark
                  ? 'border-gray-800 hover:bg-gray-800/50'
                  : 'border-gray-200 hover:bg-slate-50'
              "
            >
              <td
                v-for="col in columnasActivas"
                :key="`${item.id}-${col.key}`"
                class="px-4 py-4 align-middle border-r last:border-r-0"
                :class="isDark ? 'text-gray-300' : 'text-gray-700'"
                :style="{ width: col.width, borderRightColor: isDark ? '#1f2937' : '#e2e8f0' }"
              >
                <div
                  v-if="col.key === 'vehiculo' && activeTab === 'vehiculos'"
                  class="flex items-center gap-3"
                >
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style="background: #922b21"
                  >
                    <i class="pi pi-car text-white text-sm"></i>
                  </div>
                  <div>
                    <p class="font-semibold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">
                      {{ nombreVehiculo(item) }}
                    </p>
                    <p class="text-xs" :class="isDark ? 'text-gray-400' : 'text-slate-500'">
                      {{ [item.color, item.anio].filter(Boolean).join(" · ") || "—" }}
                    </p>
                  </div>
                </div>
                <div v-else-if="col.key === 'estado' && activeTab === 'vehiculos'">
                  <span class="estado-badge" :style="estadoVehiculoStyle(item.estado, isDark)">
                    {{ labelEstadoTabla(item.estado) }}
                  </span>
                </div>
                <div
                  v-else-if="activeTab === 'seguros' && col.key === 'seguro_vehiculo'"
                  class="flex items-center gap-3 min-w-0"
                >
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style="background: #1d4ed8"
                  >
                    <i class="pi pi-shield text-white text-sm"></i>
                  </div>
                  <div class="min-w-0">
                    <p
                      class="font-semibold truncate"
                      :class="isDark ? 'text-gray-200' : 'text-gray-800'"
                    >
                      {{ nombreSeguroVehiculo(item) }}
                    </p>
                    <p
                      class="text-xs truncate"
                      :class="isDark ? 'text-gray-400' : 'text-slate-500'"
                    >
                      {{ item.vehiculo?.placa || "Sin placa" }}
                      <template v-if="item.vehiculo?.propietario?.nombre">
                        · {{ item.vehiculo.propietario.nombre }}
                      </template>
                    </p>
                  </div>
                </div>
                <div
                  v-else-if="activeTab === 'seguros' && col.key === 'seguro_vigencia'"
                  class="text-xs leading-5"
                >
                  <p><span class="font-semibold">Inicio:</span> {{ formatFechaSeguro(item.fecha_inicio) }}</p>
                  <p><span class="font-semibold">Vence:</span> {{ formatFechaSeguro(item.fecha_vencimiento) }}</p>
                </div>
                <div
                  v-else-if="activeTab === 'seguros' && col.key === 'seguro_cobertura'"
                  class="max-w-[180px] truncate"
                  :title="item.cobertura || 'Sin cobertura descrita'"
                >
                  {{ item.cobertura || "Sin cobertura descrita" }}
                </div>
                <div v-else-if="activeTab === 'seguros' && col.key === 'seguro_estado'">
                  <span class="estado-badge" :class="estadoSeguroClase(item.estado)">{{
                    item.estado || "Sin estado"
                  }}</span>
                  <p
                    v-if="seguroFechaVencida(item)"
                    class="text-[11px] mt-1 font-semibold text-red-500"
                  >
                    Fecha vencida
                  </p>
                </div>
                <span
                  v-else
                  :class="col.key === 'nombre' || col.key === 'modelo' ? 'font-semibold' : ''"
                >
                  {{ renderCelda(item, col.key) }}
                </span>
              </td>
              <td v-if="mostrarAcciones" class="px-5 py-4 text-right">
                <div class="inline-flex items-center gap-2">
                  <template v-if="activeTab === 'seguros'">
                    <button
                      type="button"
                      class="w-8 h-8 rounded-lg inline-flex items-center justify-center border transition-all hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      :class="
                        isDark
                          ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      "
                      :disabled="seguroGuardando"
                      title="Ver seguro"
                      @click="accionVerSeguro(item)"
                    >
                      <i class="pi pi-eye text-xs"></i>
                    </button>
                    <button
                      v-if="puedeGestionarSeguros"
                      type="button"
                      class="w-8 h-8 rounded-lg inline-flex items-center justify-center border transition-all hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      :class="
                        isDark
                          ? 'border-blue-800 bg-blue-950/40 text-blue-300 hover:bg-blue-950/70'
                          : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                      "
                      :disabled="seguroGuardando"
                      title="Editar seguro"
                      @click="accionEditarSeguro(item)"
                    >
                      <i class="pi pi-pencil text-xs"></i>
                    </button>
                    <button
                      v-if="puedeGestionarSeguros"
                      type="button"
                      class="w-8 h-8 rounded-lg inline-flex items-center justify-center border transition-all hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      :class="
                        isDark
                          ? 'border-red-800 bg-red-950/40 text-red-300 hover:bg-red-950/70'
                          : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      "
                      :disabled="seguroGuardando"
                      title="Anular seguro"
                      @click="accionAnularSeguro(item)"
                    >
                      <i class="pi pi-ban text-xs"></i>
                    </button>
                  </template>
                  <button
                    v-if="activeTab !== 'seguros' && puedeEscribirTab"
                    type="button"
                    @click="accionEditar(item)"
                    class="w-8 h-8 rounded-lg inline-flex items-center justify-center border transition-all hover:shadow-sm"
                    :class="
                      isDark
                        ? 'border-blue-800 bg-blue-950/40 text-blue-300 hover:bg-blue-950/70 hover:border-blue-700'
                        : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                    "
                    :title="`Editar ${tabActiva.label.slice(0, -1).toLowerCase()}`"
                  >
                    <i class="pi pi-pencil text-xs"></i>
                  </button>
                  <button
                    v-if="
                      activeTab !== 'seguros' &&
                      puedeEscribirTab &&
                      ['vehiculos', 'marcas', 'categorias', 'propietarios'].includes(activeTab) &&
                      !vehiculoFueraServicio(item)
                    "
                    type="button"
                    @click="accionEliminar(item)"
                    class="w-8 h-8 rounded-lg inline-flex items-center justify-center border transition-all hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    :class="
                      isDark
                        ? 'border-red-800 bg-red-950/40 text-red-300 hover:bg-red-950/70 hover:border-red-700'
                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    "
                    :disabled="vehiculoEnUso(item)"
                    :title="
                      activeTab === 'vehiculos'
                        ? (vehiculoEnUso(item)
                            ? 'No se puede enviar fuera de servicio mientras está ' + labelEstadoTabla(item.estado).toLowerCase()
                            : 'Enviar fuera de servicio')
                        : `Eliminar ${tabActiva.label.slice(0, -1).toLowerCase()}`
                    "
                  >
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                  <button
                    v-if="activeTab === 'vehiculos' && puedeGestionarVehiculos && vehiculoFueraServicio(item)"
                    type="button"
                    @click="accionRestaurar(item)"
                    class="w-8 h-8 rounded-lg inline-flex items-center justify-center border transition-all hover:shadow-sm"
                    :class="
                      isDark
                        ? 'border-amber-800 bg-amber-950/40 text-amber-300 hover:bg-amber-950/70 hover:border-amber-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    "
                    title="Restaurar vehículo"
                  >
                    <i class="pi pi-refresh text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="itemsFiltrados.length === 0">
              <td
                :colspan="
                  columnasActivas.length + (mostrarAcciones ? 1 : 0)
                "
                class="px-5 py-16 text-center"
              >
                <i
                  :class="[
                    iconoTabActivo,
                    'text-4xl mb-3 block',
                    isDark ? 'text-gray-700' : 'text-gray-200',
                  ]"
                ></i>
                <p class="font-medium" :class="isDark ? 'text-gray-400' : 'text-slate-500'">
                  {{ emptyLabel }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        class="px-5 py-3 border-t text-xs"
        :class="isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'"
      >
        <div
          v-if="activeTab === 'vehiculos'"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <span>
            Mostrando {{ pagination.from }}-{{ pagination.to }} de {{ pagination.total }} vehículo{{
              pagination.total !== 1 ? "s" : ""
            }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="!puedeRetroceder || store.loading"
              @click="cambiarPaginaVehiculos(pagination.current_page - 1)"
            >
              <i class="pi pi-chevron-left text-[0.65rem]"></i>
              Anterior
            </button>
            <span class="pagination-page" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
              Página {{ pagination.current_page }} de {{ pagination.last_page }}
            </span>
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="!puedeAvanzar || store.loading"
              @click="cambiarPaginaVehiculos(pagination.current_page + 1)"
            >
              Siguiente
              <i class="pi pi-chevron-right text-[0.65rem]"></i>
            </button>
          </div>
        </div>
        <div
          v-else-if="activeTab !== 'seguros'"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <span>
            Mostrando {{ catalogoPagination.from }}-{{ catalogoPagination.to }} de
            {{ catalogoPagination.total }} {{ contadorLabel(catalogoPagination.total) }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="!puedeRetrocederCatalogo || isLoadingTab"
              @click="cambiarPaginaCatalogo(catalogoPaginaActual - 1)"
            >
              <i class="pi pi-chevron-left text-[0.65rem]"></i>
              Anterior
            </button>
            <span class="pagination-page" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
              Página {{ catalogoPagination.current_page }} de {{ catalogoPagination.last_page }}
            </span>
            <button
              type="button"
              class="pagination-btn"
              :class="isDark ? 'pagination-btn-dark' : 'pagination-btn-light'"
              :disabled="!puedeAvanzarCatalogo || isLoadingTab"
              @click="cambiarPaginaCatalogo(catalogoPaginaActual + 1)"
            >
              Siguiente
              <i class="pi pi-chevron-right text-[0.65rem]"></i>
            </button>
          </div>
        </div>
        <div v-else class="flex items-center justify-between gap-3">
          <span
            >Mostrando {{ itemsFiltrados.length }} seguro{{
              itemsFiltrados.length !== 1 ? "s" : ""
            }}
            vigente{{ itemsFiltrados.length !== 1 ? "s" : "" }}</span
          >
        </div>
      </div>
    </div>

    <VehiculosModal
      v-if="puedeGestionarVehiculos"
      ref="vehiculoModalRef"
      :visible="modalAbierto"
      :modo-edicion="modoEdicion"
      :vehiculo="vehiculoSeleccionado"
      @guardar="guardarVehiculo"
      @cerrar="modalAbierto = false"
    />

    <VehiculosCatalogoModal
      v-if="puedeGestionarCatalogos"
      :visible="catalogoAbierto"
      :tipo="catalogoTipo"
      :registro-edicion="catalogoRegistroEdicion"
      @cerrar="cerrarCatalogo"
      @guardado="onCatalogoGuardado"
    />

    <SeguroModal
      v-if="puedeVerSeguros"
      ref="seguroModalRef"
      :visible="seguroModalAbierto && (seguroModo === 'view' || puedeGestionarSeguros)"
      :mode="seguroModo"
      :seguro="seguroSeleccionado"
      :vehiculos="vehiculosSeguro"
      :loading="seguroGuardando"
      :backend-errors="seguroErrores"
      :backend-message="seguroMensaje"
      @cerrar="cerrarSeguroModal"
      @guardar="guardarSeguro"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import api from "@/services/api";
import VehiculosModal from "@/components/vehiculos/VehiculosModal.vue";
import VehiculosCatalogoModal from "@/components/vehiculos/VehiculosCatalogoModal.vue";
import SeguroModal from "@/components/vehiculos/SeguroModal.vue";
import { useVehiculosStore } from "@/stores/vehiculos";
import { useSegurosStore } from "@/stores/seguros";
import { useAuthStore } from "@/stores/auth";
import { useAppTheme } from "@/composables/useAppTheme";
import { fetchAllPaginated } from "@/utils/apiPagination";
import {
  nombreVehiculo,
  estadoVehiculoStyle,
  labelEstadoVehiculo,
  ESTADOS_VEHICULO_TODOS,
} from "@/utils/vehiculoFormatters";
import { toastSuccess } from "@/utils/toast";

const { isDark } = useAppTheme();
const store = useVehiculosStore();
const segurosStore = useSegurosStore();
const authStore = useAuthStore();
const vehiculoModalRef = ref(null);
const seguroModalRef = ref(null);

const search = ref("");
const filtroEstado = ref("");
const route = useRoute();
const router = useRouter();
const activeTab = ref("vehiculos");
const modalAbierto = ref(false);
const catalogoAbierto = ref(false);
const catalogoTipo = ref("marca");
const catalogoRegistroEdicion = ref(null);
const modoEdicion = ref(false);
const vehiculoSeleccionado = ref(null);
const modelos = ref([]);
const cargandoModelos = ref(false);
const catalogoPaginaActual = ref(1);
const catalogoItemsPorPagina = 10;
const seguroModalAbierto = ref(false);
const seguroModo = ref("view");
const seguroSeleccionado = ref(null);
const vehiculosSeguro = ref([]);
const seguroGuardando = ref(false);
const seguroErrores = ref({});
const seguroMensaje = ref("");

const estadosFiltro = ESTADOS_VEHICULO_TODOS;
const ordenEstadosVehiculo = {
  DISPONIBLE: 1,
  RESERVADO: 2,
  RENTADO: 2.5,
  "EN PROCESO": 2.75,
  MANTENIMIENTO: 3,
  "FUERA DE SERVICIO": 4,
};
const nombreFlexibleRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ./'-]+$/;
const nombrePersonaRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]+$/;
const contieneLetraRegex = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const vehiculos = computed(() => store.vehiculos);
const pagination = computed(() => store.pagination);
const puedeRetroceder = computed(() => pagination.value.current_page > 1);
const puedeAvanzar = computed(() => pagination.value.current_page < pagination.value.last_page);
const marcas = computed(() => store.marcas);
const categorias = computed(() => store.categorias);
const propietarios = computed(() => store.propietarios);
// Lista completa de vehículos (todas las páginas), solo para contadores.
const vehiculosCompletos = computed(() => store.todosVehiculos);
const seguros = computed(() => segurosStore.seguros);
const proximoAVencer = computed(() => segurosStore.proximoAVencer);
const puedeGestionarVehiculos = computed(() =>
  authStore.userRoles.some((role) => ["ADMINISTRADOR", "EMPLEADO"].includes(role)),
);
const puedeGestionarCatalogos = computed(() => authStore.userRoles.includes("ADMINISTRADOR"));
const puedeGestionarPropietarios = computed(() => authStore.userRoles.includes("ADMINISTRADOR"));
const puedeGestionarSeguros = computed(() => authStore.userRoles.includes("ADMINISTRADOR"));
const puedeEscribirTab = computed(() => {
  if (activeTab.value === "vehiculos") return puedeGestionarVehiculos.value;
  if (["marcas", "modelos", "categorias"].includes(activeTab.value)) return puedeGestionarCatalogos.value;
  if (activeTab.value === "propietarios") return puedeGestionarPropietarios.value;
  if (activeTab.value === "seguros") return puedeGestionarSeguros.value;
  return false;
});
const puedeVerSeguros = computed(() =>
  authStore.userRoles.some((role) => ["ADMINISTRADOR", "EMPLEADO"].includes(role)),
);
const mostrarAcciones = computed(() =>
  puedeEscribirTab.value || (activeTab.value === "seguros" && puedeVerSeguros.value),
);
const tabsVisibles = computed(() =>
  puedeVerSeguros.value ? tabs : tabs.filter((tab) => tab.value !== "seguros"),
);
let searchTimer = null;

const tabs = [
  { value: "vehiculos", label: "Vehículos", icon: "pi pi-car", color: "#c0392b" },
  { value: "marcas", label: "Marcas", icon: "pi pi-bookmark", color: "#f0a500" },
  { value: "modelos", label: "Modelos", icon: "pi pi-sitemap", color: "#7c3aed" },
  { value: "categorias", label: "Categorías", icon: "pi pi-tags", color: "#2563eb" },
  { value: "propietarios", label: "Propietarios", icon: "pi pi-users", color: "#059669" },
  { value: "seguros", label: "Seguros", icon: "pi pi-shield", color: "#1d4ed8" },
];

function estiloIconoTab(tab, activo) {
  if (activo) {
    return {
      background: "rgba(255,255,255,0.22)",
      color: tab.color === "#c0392b" ? "#f0a500" : tab.color,
    };
  }
  return {
    background: `${tab.color}1f`,
    color: tab.color,
  };
}

const columnasPorTab = {
  vehiculos: [
    { key: "vehiculo", label: "Vehículo", width: "255px" },
    { key: "placa", label: "Placa", width: "120px" },
    { key: "capacidad_pasajeros", label: "Pasajeros", width: "110px" },
    { key: "categoria_nombre", label: "Categoría", width: "160px" },
    { key: "propietario_nombre", label: "Propietario", width: "230px" },
    { key: "estado", label: "Estado", width: "170px" },
  ],
  marcas: [
    { key: "nombre", label: "Nombre", width: "58%" },
    { key: "modelos_count", label: "Modelos", width: "30%" },
  ],
  categorias: [
    { key: "nombre", label: "Nombre", width: "35%" },
    { key: "descripcion", label: "Tarifa", width: "35%" },
    { key: "vehiculos_count", label: "Vehículos", width: "18%" },
  ],
  modelos: [
    { key: "modelo", label: "Modelo", width: "35%" },
    { key: "marca_nombre", label: "Marca", width: "35%" },
    { key: "vehiculos_count", label: "Vehículos", width: "18%" },
  ],
  propietarios: [
    { key: "nombre", label: "Nombre", width: "36%" },
    { key: "telefono", label: "Teléfono", width: "18%" },
    { key: "tipo_propietario", label: "Tipo", width: "16%" },
    { key: "vehiculos_count", label: "Vehículos", width: "18%" },
  ],
  seguros: [
    { key: "seguro_vehiculo", label: "Vehículo / propietario", width: "240px" },
    { key: "aseguradora", label: "Aseguradora", width: "160px" },
    { key: "numero_poliza", label: "N.º de póliza", width: "150px" },
    { key: "seguro_vigencia", label: "Vigencia", width: "170px" },
    { key: "seguro_cobertura", label: "Cobertura", width: "190px" },
    { key: "seguro_estado", label: "Estado", width: "130px" },
  ],
};

const subtitulos = {
  vehiculos: "Gestiona la flota de vehículos",
  marcas: "Administra las marcas registradas",
  categorias: "Administra las categorías y tarifas",
  modelos: "Administra los modelos por marca",
  propietarios: "Administra los propietarios de la flota",
  seguros: "Administra las pólizas vigentes de la flota",
};

onMounted(() => {
  cargarVehiculos();
  store.fetchCatalogos();
  store.fetchTodosVehiculos();
  cargarModelos();
  if (puedeVerSeguros.value) segurosStore.fetchSeguros().catch(() => {});
  if (route.query.tab) cambiarTab(String(route.query.tab));
});

// Navegar con atrás/adelante entre pestañas enlazadas.
watch(() => route.query.tab, (tab) => {
  cambiarTab(tab ? String(tab) : "vehiculos");
});

watch([search, filtroEstado], () => {
  if (activeTab.value !== "vehiculos") return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => cargarVehiculos(1), 300);
});

watch([search, activeTab], () => {
  if (activeTab.value === "vehiculos") return;
  catalogoPaginaActual.value = 1;
});

function extraerLista(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  return [];
}

function esRegistroValido(item, tab) {
  if (!item || item.id == null) return false;
  if (tab === "vehiculos") return Boolean(item.placa?.trim?.() || item.placa);
  if (tab === "seguros") return Boolean(item.numero_poliza || item.aseguradora);
  return Boolean(String(item.nombre ?? "").trim());
}

function listaTab(tab) {
  const map = {
    vehiculos: extraerLista(vehiculos.value),
    marcas: extraerLista(marcas.value),
    categorias: extraerLista(categorias.value),
    modelos: extraerLista(modelos.value),
    propietarios: extraerLista(propietarios.value),
    seguros: extraerLista(seguros.value),
  };
  return (map[tab] ?? []).filter((item) => esRegistroValido(item, tab));
}

const baseItemsActivos = computed(() => listaTab(activeTab.value));

const columnasActivas = computed(() => columnasPorTab[activeTab.value] ?? columnasPorTab.vehiculos);
const subtituloActivo = computed(() => subtitulos[activeTab.value] ?? subtitulos.vehiculos);
const tabActiva = computed(() => tabs.find((t) => t.value === activeTab.value) ?? tabs[0]);
const iconoTabActivo = computed(() => tabActiva.value.icon);

const itemsFiltrados = computed(() => {
  const term = search.value.trim().toLowerCase();
  const filtrados = baseItemsActivos.value.filter((item) => {
    if (
      activeTab.value === "vehiculos" &&
      filtroEstado.value &&
      item.estado !== filtroEstado.value
    ) {
      return false;
    }
    if (!term) return true;
    return textoBusqueda(item).some((v) => String(v).toLowerCase().includes(term));
  });
  if (activeTab.value !== "vehiculos") return filtrados;
  return ordenarVehiculosPorEstado(filtrados);
});

const catalogoPagination = computed(() => {
  const total = itemsFiltrados.value.length;
  const lastPage = Math.max(1, Math.ceil(total / catalogoItemsPorPagina));
  const currentPage = Math.min(catalogoPaginaActual.value, lastPage);
  const from = total ? (currentPage - 1) * catalogoItemsPorPagina + 1 : 0;
  const to = total ? Math.min(currentPage * catalogoItemsPorPagina, total) : 0;

  return {
    current_page: currentPage,
    last_page: lastPage,
    per_page: catalogoItemsPorPagina,
    total,
    from,
    to,
  };
});

const itemsVisibles = computed(() => {
  if (activeTab.value === "vehiculos" || activeTab.value === "seguros") return itemsFiltrados.value;
  const start = (catalogoPagination.value.current_page - 1) * catalogoItemsPorPagina;
  return itemsFiltrados.value.slice(start, start + catalogoItemsPorPagina);
});

const puedeRetrocederCatalogo = computed(() => catalogoPagination.value.current_page > 1);
const puedeAvanzarCatalogo = computed(
  () => catalogoPagination.value.current_page < catalogoPagination.value.last_page,
);

watch(catalogoPagination, (value) => {
  if (activeTab.value === "vehiculos") return;
  if (catalogoPaginaActual.value !== value.current_page) {
    catalogoPaginaActual.value = value.current_page;
  }
});

function conteoTab(tab) {
  if (tab === "vehiculos") return store.total;
  return listaTab(tab).length;
}

function textoBusqueda(item) {
  if (activeTab.value === "vehiculos") {
    return [
      nombreVehiculo(item),
      item.placa,
      item.color,
      item.categoria?.nombre,
      nombrePropietarioVehiculo(item),
      item.estado,
    ];
  }
  if (activeTab.value === "marcas") {
    return [item.nombre, String(item.modelos_count ?? "")];
  }
  if (activeTab.value === "categorias") {
    return [item.nombre, descripcionCategoria(item), String(item.vehiculos_count ?? "")];
  }
  if (activeTab.value === "modelos") {
    return [item.nombre, item.marca?.nombre, String(item.vehiculos_count ?? "")];
  }
  if (activeTab.value === "propietarios") {
    return [item.nombre, item.telefono, item.tipo_propietario, String(item.vehiculos_count ?? "")];
  }
  if (activeTab.value === "seguros") {
    return [
      nombreSeguroVehiculo(item),
      item.vehiculo?.placa,
      item.vehiculo?.propietario?.nombre,
      item.aseguradora,
      item.numero_poliza,
      item.fecha_inicio,
      item.fecha_vencimiento,
      item.cobertura,
      item.estado,
    ];
  }
  return [item.nombre];
}

const searchPlaceholder = computed(() => {
  const map = {
    vehiculos: "Buscar por placa, marca o modelo...",
    marcas: "Buscar por nombre de marca...",
    categorias: "Buscar por nombre o descripción...",
    modelos: "Buscar por modelo o marca...",
    propietarios: "Buscar por nombre, teléfono o tipo...",
    seguros: "Buscar por vehículo, aseguradora o póliza...",
  };
  return map[activeTab.value];
});

const isLoadingTab = computed(() => {
  if (activeTab.value === "vehiculos") return store.loading;
  if (activeTab.value === "modelos") return cargandoModelos.value;
  if (activeTab.value === "seguros") return segurosStore.loading;
  return store.catalogosCargando;
});

const loadingLabel = computed(() => `Cargando ${tabActiva.value.label.toLowerCase()}...`);
const emptyLabel = computed(() => {
  if (search.value.trim())
    return `La búsqueda no produjo resultados en ${tabActiva.value.label.toLowerCase()}.`;
  return `No se encontraron ${tabActiva.value.label.toLowerCase()}.`;
});

const nuevoLabel = computed(() => {
  const map = {
    vehiculos: "Nuevo Vehículo",
    marcas: "Nueva Marca",
    categorias: "Nueva Categoría",
    modelos: "Nuevo Modelo",
    propietarios: "Nuevo Propietario",
    seguros: "Nuevo Seguro",
  };
  return map[activeTab.value];
});

function cambiarTab(tab) {
  if (tab === "seguros" && !puedeVerSeguros.value) return;
  if (!tabsVisibles.value.some((t) => t.value === tab)) return;
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  // Deja la pestaña en la URL (?tab=...) para poder enlazarla o recargar sin perderla.
  if (route.query.tab !== tab) {
    router.replace({ query: { ...route.query, tab: tab === "vehiculos" ? undefined : tab } });
  }
  search.value = "";
  catalogoPaginaActual.value = 1;
  if (tab !== "vehiculos") filtroEstado.value = "";
  if (tab === "vehiculos") cargarVehiculos(1);
  if (tab === "seguros" && !seguros.value.length && puedeVerSeguros.value)
    segurosStore.fetchSeguros().catch(() => {});
}

function vehiculosParams(page = pagination.value.current_page || 1) {
  const params = { page };
  const term = search.value.trim();
  if (term) params.search = term;
  if (filtroEstado.value) params.estado = filtroEstado.value;
  return params;
}

async function cargarVehiculos(page = pagination.value.current_page || 1) {
  await store.fetchVehiculos(vehiculosParams(page));
  if (page > 1 && vehiculos.value.length === 0) {
    await store.fetchVehiculos(vehiculosParams(page - 1));
  }
}

async function cambiarPaginaVehiculos(page) {
  if (page < 1 || page > pagination.value.last_page || page === pagination.value.current_page)
    return;
  await cargarVehiculos(page);
}

function cambiarPaginaCatalogo(page) {
  if (page < 1 || page > catalogoPagination.value.last_page || page === catalogoPaginaActual.value)
    return;
  catalogoPaginaActual.value = page;
}

function descripcionCategoria(item) {
  if (!item.precio_dia && item.precio_dia !== 0) return "Sin tarifa definida";
  return `Tarifa diaria: $${Number(item.precio_dia).toFixed(2)}`;
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizarTexto(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizarComparacion(value) {
  return normalizarTexto(value).toLowerCase();
}

function validarNombreCatalogo(value, tipo, max = 80) {
  const nombre = normalizarTexto(value);
  if (!nombre) return "El nombre es obligatorio";
  if (nombre.length < 2) return "El nombre debe tener al menos 2 caracteres";
  if (nombre.length > max) return `El nombre no puede tener más de ${max} caracteres`;
  if (tipo === "propietario" && !nombrePersonaRegex.test(nombre)) {
    return "El nombre solo debe contener letras y signos básicos";
  }
  if (tipo !== "propietario" && !nombreFlexibleRegex.test(nombre)) {
    return "El nombre contiene caracteres no permitidos";
  }
  if (tipo === "categoria" && !contieneLetraRegex.test(nombre)) {
    return "La categoría debe incluir al menos una letra";
  }
  return null;
}

function existeNombreCatalogo(lista, nombre, exceptId = null, extra = () => true) {
  const normalizado = normalizarComparacion(nombre);
  return lista.some((item) => {
    if (exceptId != null && item.id == exceptId) return false;
    return normalizarComparacion(item.nombre) === normalizado && extra(item);
  });
}

function validarPrecioDia(value) {
  const texto = String(value ?? "").trim();
  const precio = Number(texto);
  if (!texto || Number.isNaN(precio) || precio < 1) return "El precio debe ser de $1.00 o más";
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return "Usa máximo dos decimales";
  return null;
}

function renderCelda(item, key) {
  const map = {
    placa: item.placa,
    capacidad_pasajeros: item.capacidad_pasajeros,
    categoria_nombre: item.categoria?.nombre,
    propietario_nombre: nombrePropietarioVehiculo(item),
    nombre: item.nombre,
    modelo: item.nombre,
    marca_nombre: item.marca?.nombre,
    modelos_count: item.modelos_count ?? contarModelosPorMarca(item.id),
    vehiculos_count: item.vehiculos_count ?? contarVehiculosRelacionados(item),
    created_at: item.created_at ? formatFecha(item.created_at) : null,
    descripcion: descripcionCategoria(item),
    telefono: item.telefono,
    tipo_propietario: item.tipo_propietario,
    seguro_propietario: item.vehiculo?.propietario?.nombre,
    aseguradora: item.aseguradora,
    numero_poliza: item.numero_poliza,
    fecha_inicio: formatFechaSeguro(item.fecha_inicio),
    fecha_vencimiento: formatFechaSeguro(item.fecha_vencimiento),
  };
  const val = map[key];
  return val === undefined || val === null || val === "" ? "—" : val;
}

function nombrePropietarioVehiculo(item) {
  if (item.propietario?.nombre) return item.propietario.nombre;
  return propietarios.value.find((p) => p.id == item.propietario_id)?.nombre;
}

function contarModelosPorMarca(marcaId) {
  return modelos.value.filter((modelo) => modelo.marca_id == marcaId || modelo.marca?.id == marcaId)
    .length;
}

function contarVehiculosRelacionados(item) {
  // Importante: se cuenta sobre `vehiculosCompletos` (todas las páginas),
  // nunca sobre `vehiculos` (paginado), porque contar sobre la página
  // actual da cifras incompletas apenas hay más de una página de vehículos.
  const id = item.id;
  if (activeTab.value === "categorias") {
    return vehiculosCompletos.value.filter(
      (vehiculo) => vehiculo.categoria_id == id || vehiculo.categoria?.id == id,
    ).length;
  }
  if (activeTab.value === "modelos") {
    return vehiculosCompletos.value.filter(
      (vehiculo) => vehiculo.modelo_id == id || vehiculo.modelo?.id == id,
    ).length;
  }
  if (activeTab.value === "propietarios") {
    return vehiculosCompletos.value.filter(
      (vehiculo) => vehiculo.propietario_id == id || vehiculo.propietario?.id == id,
    ).length;
  }
  return item.vehiculos_count ?? 0;
}

function contadorLabel(total) {
  const labels = {
    vehiculos: total === 1 ? "vehículo" : "vehículos",
    marcas: total === 1 ? "marca" : "marcas",
    categorias: total === 1 ? "categoría" : "categorías",
    modelos: total === 1 ? "modelo" : "modelos",
    propietarios: total === 1 ? "propietario" : "propietarios",
    seguros: total === 1 ? "seguro" : "seguros",
  };
  return labels[activeTab.value] || "registros";
}

function labelEstadoTabla(estado) {
  return labelEstadoVehiculo(estado) || "Sin estado";
}

function vehiculoFueraServicio(item) {
  return activeTab.value === "vehiculos" && item?.estado === "FUERA DE SERVICIO";
}

const ESTADOS_VEHICULO_EN_USO = ["RENTADO"];
function vehiculoEnUso(item) {
  return activeTab.value === "vehiculos" && ESTADOS_VEHICULO_EN_USO.includes(item?.estado);
}

function nombreSeguroVehiculo(seguro) {
  if (seguro?.vehiculo) return nombreVehiculo(seguro.vehiculo);
  return seguro?.vehiculo_id ? `Vehículo #${seguro.vehiculo_id}` : "Vehículo no disponible";
}

function formatFechaSeguro(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Date(year, month - 1, day).toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fechaSeguroCalendario(value) {
  const [year, month, day] = String(value || "")
    .slice(0, 10)
    .split("-")
    .map(Number);
  return year && month && day ? year * 10000 + month * 100 + day : null;
}

function seguroFechaVencida(seguro) {
  if (seguro?.estado !== "VIGENTE") return false;
  const hoy = new Date();
  const actual = hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate();
  const vencimiento = fechaSeguroCalendario(seguro.fecha_vencimiento);
  return vencimiento != null && vencimiento < actual;
}

function estadoSeguroClase(estado) {
  if (estado === "CANCELADO")
    return isDark.value ? "bg-red-950/50 text-red-300" : "bg-red-100 text-red-700";
  if (estado === "VENCIDO")
    return isDark.value ? "bg-amber-950/50 text-amber-300" : "bg-amber-100 text-amber-700";
  return isDark.value ? "bg-green-950/50 text-green-300" : "bg-green-100 text-green-700";
}

function resumenSeguro(seguro) {
  return `${seguro?.aseguradora || "Aseguradora no disponible"} · ${nombreSeguroVehiculo(seguro)}`;
}

function mensajeErrorSeguroTexto(mensaje) {
  return String(mensaje || "")
    .toLowerCase()
    .includes("permiso")
    ? "No tienes permiso para consultar los seguros."
    : mensaje;
}

function ordenarVehiculosPorEstado(lista) {
  return [...lista].sort((a, b) => {
    const ordenA = ordenEstadosVehiculo[a.estado] ?? 99;
    const ordenB = ordenEstadosVehiculo[b.estado] ?? 99;
    if (ordenA !== ordenB) return ordenA - ordenB;
    return nombreVehiculo(a).localeCompare(nombreVehiculo(b), "es", { sensitivity: "base" });
  });
}

function abrirModalCrear() {
  if (!puedeGestionarVehiculos.value) return;
  modoEdicion.value = false;
  vehiculoSeleccionado.value = null;
  modalAbierto.value = true;
}

function abrirCatalogo(tipo) {
  if (!puedeGestionarCatalogos.value || !["marca", "modelo", "categoria", "propietario"].includes(tipo)) return;
  catalogoTipo.value = tipo;
  catalogoRegistroEdicion.value = null;
  catalogoAbierto.value = true;
}

function abrirCatalogoEditar(tipo, item) {
  if (!puedeGestionarCatalogos.value || !["marca", "modelo", "categoria", "propietario"].includes(tipo)) return;
  catalogoTipo.value = tipo;
  catalogoRegistroEdicion.value = { ...item };
  catalogoAbierto.value = true;
}

function cerrarCatalogo() {
  catalogoAbierto.value = false;
  catalogoRegistroEdicion.value = null;
}

async function onCatalogoGuardado({ tipo, modoEdicion: catalogoEditado = false }) {
  store.invalidarCatalogos(tipo);
  await Promise.all([
    store.fetchCatalogos(true),
    tipo === "modelo" ? cargarModelos() : Promise.resolve(),
  ]);
  const labels = {
    marca: "Marca registrada",
    categoria: "Categoría registrada",
    modelo: "Modelo registrado",
    propietario: "Propietario registrado",
  };
  const labelsEdicion = {
    propietario: "Propietario actualizado",
  };
  toastSuccess(catalogoEditado ? labelsEdicion[tipo] || "Registro actualizado" : labels[tipo]);
}

function abrirModalEditar(v) {
  if (!puedeGestionarVehiculos.value) return;
  modoEdicion.value = true;
  vehiculoSeleccionado.value = { ...v };
  modalAbierto.value = true;
}

async function accionEditar(item) {
  if (!puedeEscribirTab.value) return;
  try {
    if (activeTab.value === "vehiculos") {
      abrirModalEditar(item);
      return;
    }
    if (activeTab.value === "marcas") {
      const result = await Swal.fire({
        title: "Editar marca",
        input: "text",
        inputValue: item.nombre,
        inputLabel: "Nombre",
        inputPlaceholder: "Nombre de la marca",
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#c0392b",
        background: isDark.value ? "#1f2937" : "#fff",
        color: isDark.value ? "#f3f4f6" : "#111827",
        inputValidator: (value) => {
          const errorNombre = validarNombreCatalogo(value, "marca", 80);
          if (errorNombre) return errorNombre;
          if (existeNombreCatalogo(marcas.value, value, item.id)) {
            return "Ya existe una marca registrada con ese nombre";
          }
          return null;
        },
      });
      if (!result.isConfirmed || !puedeGestionarCatalogos.value) return;
      await api.put(`/admin/marcas/${item.id}`, { nombre: normalizarTexto(result.value) });
      await store.fetchCatalogos(true);
      return;
    }
    if (activeTab.value === "categorias") {
      const { value, isConfirmed } = await Swal.fire({
        title: "Editar categoría",
        html: `
        <input id="swal-cat-nombre" class="swal2-input" placeholder="Nombre" value="${item.nombre ?? ""}">
        <input id="swal-cat-precio" type="number" min="1" step="0.01" class="swal2-input" placeholder="Precio por día" value="${item.precio_dia ?? ""}">
      `,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#c0392b",
        background: isDark.value ? "#1f2937" : "#fff",
        color: isDark.value ? "#f3f4f6" : "#111827",
        preConfirm: () => {
          const nombre = normalizarTexto(document.getElementById("swal-cat-nombre")?.value);
          const precioRaw = document.getElementById("swal-cat-precio")?.value;
          const errorNombre = validarNombreCatalogo(nombre, "categoria", 80);
          const errorPrecio = validarPrecioDia(precioRaw);
          if (errorNombre) {
            Swal.showValidationMessage(errorNombre);
            return false;
          }
          if (existeNombreCatalogo(categorias.value, nombre, item.id)) {
            Swal.showValidationMessage("Ya existe una categoría registrada con ese nombre");
            return false;
          }
          if (errorPrecio) {
            Swal.showValidationMessage(errorPrecio);
            return false;
          }
          return { nombre, precio_dia: Number(precioRaw) };
        },
      });
      if (!isConfirmed || !puedeGestionarCatalogos.value) return;
      await api.put(`/admin/categorias/${item.id}`, value);
      await store.fetchCatalogos(true);
      return;
    }
    if (activeTab.value === "modelos") {
      await store.fetchCatalogos();
      if (!puedeGestionarCatalogos.value) return;
      const marcasHtml = store.marcas
        .map(
          (m) =>
            `<option value="${m.id}" ${m.id == (item.marca_id || item.marca?.id) ? "selected" : ""}>${m.nombre}</option>`,
        )
        .join("");
      const { value, isConfirmed } = await Swal.fire({
        title: "Editar modelo",
        html: `
        <input id="swal-mod-nombre" class="swal2-input" placeholder="Nombre" value="${item.nombre ?? ""}">
        <select id="swal-mod-marca" class="swal2-input">${marcasHtml}</select>
      `,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#c0392b",
        background: isDark.value ? "#1f2937" : "#fff",
        color: isDark.value ? "#f3f4f6" : "#111827",
        preConfirm: () => {
          const nombre = normalizarTexto(document.getElementById("swal-mod-nombre")?.value);
          const marca_id = Number(document.getElementById("swal-mod-marca")?.value);
          const errorNombre = validarNombreCatalogo(nombre, "modelo", 100);
          if (errorNombre) {
            Swal.showValidationMessage(errorNombre);
            return false;
          }
          if (!marca_id) {
            Swal.showValidationMessage("Selecciona una marca");
            return false;
          }
          if (
            existeNombreCatalogo(
              modelos.value,
              nombre,
              item.id,
              (modelo) => Number(modelo.marca_id || modelo.marca?.id) === marca_id,
            )
          ) {
            Swal.showValidationMessage(
              "Ya existe un modelo con ese nombre para la marca seleccionada",
            );
            return false;
          }
          return { nombre, marca_id };
        },
      });
      if (!isConfirmed || !puedeGestionarCatalogos.value) return;
      await api.put(`/admin/modelos/${item.id}`, value);
      await cargarModelos();
      return;
    }
    if (activeTab.value === "propietarios") {
      abrirCatalogoEditar("propietario", item);
    }
    if (activeTab.value === "seguros") {
      await accionEditarSeguro(item);
    }
  } catch (e) {
    await Swal.fire({
      icon: "error",
      title: "No se pudo guardar",
      text: mensajeErrorApi(e, "Ocurrió un error al actualizar el registro."),
      confirmButtonColor: "#c0392b",
      background: isDark.value ? "#1f2937" : "#fff",
      color: isDark.value ? "#f3f4f6" : "#111827",
    });
  }
}

async function accionRestaurar(item) {
  if (!puedeGestionarVehiculos.value || activeTab.value !== "vehiculos") return;
  const nombre = nombreVehiculo(item);
  const result = await Swal.fire({
    icon: "question",
    title: "¿Restaurar vehículo?",
    text: `${nombre} volverá a estar disponible para reservas y contratos.`,
    input: "textarea",
    inputLabel: "Motivo de restauración",
    inputPlaceholder: "Ej. Reparación completada, vehículo revisado...",
    inputAttributes: { maxlength: 500 },
    showCancelButton: true,
    confirmButtonText: "Restaurar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c0392b",
    cancelButtonColor: "#6b7280",
    background: isDark.value ? "#1f2937" : "#fff",
    color: isDark.value ? "#f3f4f6" : "#111827",
    preConfirm: (value) => {
      const motivo = normalizarTexto(value);
      if (!motivo) {
        Swal.showValidationMessage("Debes indicar el motivo de restauración");
        return false;
      }
      return motivo;
    },
  });

  if (!result.isConfirmed || !puedeGestionarVehiculos.value || activeTab.value !== "vehiculos") return;

  try {
    await store.restaurar(item.id, result.value);
    await cargarVehiculos();
    toastSuccess("Vehículo restaurado");
  } catch (e) {
    await Swal.fire({
      icon: "error",
      title: "No se pudo restaurar",
      text: mensajeErrorApi(e, store.error || "Ocurrió un error al restaurar el vehículo."),
      confirmButtonColor: "#c0392b",
      background: isDark.value ? "#1f2937" : "#fff",
      color: isDark.value ? "#f3f4f6" : "#111827",
    });
  }
}
async function accionEliminar(item) {
  if (!puedeEscribirTab.value || !["vehiculos", "marcas", "categorias", "propietarios"].includes(activeTab.value)) return;
  if (activeTab.value === "vehiculos" && vehiculoEnUso(item)) {
    await Swal.fire({
      icon: "info",
      title: "No se puede enviar fuera de servicio",
      text: `${nombreVehiculo(item)} está ${labelEstadoTabla(item.estado).toLowerCase()}. Espera a que finalice esa operación antes de darlo de baja.`,
      confirmButtonColor: "#c0392b",
      background: isDark.value ? "#1f2937" : "#fff",
      color: isDark.value ? "#f3f4f6" : "#111827",
    });
    return;
  }
  const tab = activeTab.value;
  const nombre = activeTab.value === "vehiculos" ? nombreVehiculo(item) : item.nombre;
  const esVehiculo = activeTab.value === "vehiculos";
  const result = await Swal.fire({
    icon: "warning",
    title: esVehiculo
      ? "¿Enviar vehículo fuera de servicio?"
      : `¿Eliminar ${tabActiva.value.label.slice(0, -1).toLowerCase()}?`,
    text: esVehiculo
      ? `${nombre} quedará fuera de servicio y se mostrará al final de la lista.`
      : `Se eliminará ${nombre}. Esta acción no se puede deshacer.`,
    showCancelButton: true,
    confirmButtonText: esVehiculo ? "Sí, enviar fuera de servicio" : "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c0392b",
    cancelButtonColor: "#6b7280",
    background: isDark.value ? "#1f2937" : "#fff",
    color: isDark.value ? "#f3f4f6" : "#111827",
  });
  if (!result.isConfirmed || activeTab.value !== tab || !puedeEscribirTab.value) return;

  try {
    const endpoints = {
      vehiculos: `/admin/vehiculos/${item.id}`,
      marcas: `/admin/marcas/${item.id}`,
      categorias: `/admin/categorias/${item.id}`,
      propietarios: `/admin/propietarios/${item.id}`,
    };
    await api.delete(endpoints[activeTab.value]);

    if (activeTab.value === "vehiculos") {
      await cargarVehiculos();
    } else {
      await store.fetchCatalogos(true);
    }

    toastSuccess(esVehiculo ? "Vehículo fuera de servicio" : "Registro eliminado");
  } catch (e) {
    await Swal.fire({
      icon: "error",
      title: esVehiculo ? "No se pudo enviar fuera de servicio" : "No se pudo eliminar",
      text: mensajeErrorEliminacion(e, activeTab.value),
      confirmButtonColor: "#c0392b",
      background: isDark.value ? "#1f2937" : "#fff",
      color: isDark.value ? "#f3f4f6" : "#111827",
    });
  }
}

function mensajeErrorApi(e, fallback) {
  const errors = e.response?.data?.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().find(Boolean);
    if (first) return String(first);
  }
  return e.response?.data?.message || fallback;
}

function mensajeErrorEliminacion(e, tab) {
  if (tab === "vehiculos") {
    return mensajeErrorApi(e, "No fue posible cambiar el estado del vehículo.");
  }
  if (tab === "categorias") {
    return mensajeErrorApi(e, "No fue posible eliminar la categoría.");
  }
  return mensajeErrorApi(e, "No fue posible eliminar el registro con la configuración actual.");
}
function accionNuevo() {
  if (!puedeEscribirTab.value) return;
  if (activeTab.value === "vehiculos") {
    abrirModalCrear();
    return;
  }
  const map = {
    marcas: "marca",
    categorias: "categoria",
    modelos: "modelo",
    propietarios: "propietario",
  };
  if (activeTab.value === "seguros") {
    if (!puedeGestionarSeguros.value || seguroGuardando.value) return;
    abrirSeguroModal("create", null);
    return;
  }
  abrirCatalogo(map[activeTab.value]);
}

async function cargarVehiculosSeguro() {
  const { items } = await fetchAllPaginated((params) => api.get("/admin/vehiculos", { params }));
  vehiculosSeguro.value = items;
}

async function abrirSeguroModal(mode, seguro) {
  if (!puedeVerSeguros.value || seguroGuardando.value || !["view", "create", "edit"].includes(mode)) return;
  if (mode !== "view" && !puedeGestionarSeguros.value) return;
  seguroModo.value = mode;
  seguroSeleccionado.value = seguro;
  seguroErrores.value = {};
  seguroMensaje.value = "";
  if (mode !== "view") {
    try {
      await cargarVehiculosSeguro();
    } catch (e) {
      await mostrarErrorSeguro(e, "No se pudieron cargar los vehículos para el seguro.");
      return;
    }
  }
  if (!puedeVerSeguros.value || (mode !== "view" && !puedeGestionarSeguros.value)) return;
  seguroModalAbierto.value = true;
}

function cerrarSeguroModal() {
  if (seguroGuardando.value) return;
  seguroModalAbierto.value = false;
  seguroSeleccionado.value = null;
  seguroErrores.value = {};
  seguroMensaje.value = "";
}

async function accionVerSeguro(item) {
  if (seguroGuardando.value || !puedeVerSeguros.value) return;
  try {
    const seguro = await segurosStore.fetchSeguro(item.id);
    await abrirSeguroModal("view", seguro || item);
  } catch (e) {
    await mostrarErrorSeguro(e, "No se pudo consultar el seguro.");
  }
}

async function accionEditarSeguro(item) {
  if (seguroGuardando.value || !puedeGestionarSeguros.value) return;
  try {
    const seguro = await segurosStore.fetchSeguro(item.id);
    if (seguro?.estado === "CANCELADO") {
      await mostrarErrorSeguro(
        { response: { status: 409, data: { message: "No se puede editar un seguro cancelado." } } },
        "No se puede editar un seguro cancelado.",
      );
      return;
    }
    await abrirSeguroModal("edit", seguro || item);
  } catch (e) {
    await mostrarErrorSeguro(e, "No se pudo cargar el seguro para editarlo.");
  }
}

async function guardarSeguro(form) {
  if (!puedeGestionarSeguros.value || seguroGuardando.value || !["create", "edit"].includes(seguroModo.value)) return;
  seguroGuardando.value = true;
  seguroErrores.value = {};
  seguroMensaje.value = "";
  try {
    if (seguroModo.value === "edit") {
      await segurosStore.actualizar(seguroSeleccionado.value.id, form);
      toastSuccess("Seguro actualizado");
    } else {
      await segurosStore.crear(form);
      toastSuccess("Seguro registrado");
    }
    seguroGuardando.value = false;
    cerrarSeguroModal();
    await segurosStore.fetchSeguros();
  } catch (e) {
    const status = e.response?.status;
    if (status === 422) {
      seguroErrores.value = e.response?.data?.errors || {};
      seguroMensaje.value = e.response?.data?.message || "Revisa los datos del seguro.";
      seguroModalRef.value?.aplicarErroresBackend?.(e);
    } else {
      await mostrarErrorSeguro(e, "No se pudo guardar el seguro.");
    }
  } finally {
    seguroGuardando.value = false;
  }
}

async function accionAnularSeguro(item) {
  if (seguroGuardando.value || !puedeGestionarSeguros.value) return;
  const result = await Swal.fire({
    icon: "warning",
    title: "¿Anular seguro?",
    text: "El registro se conservará con estado CANCELADO y dejará de aparecer entre los seguros vigentes.",
    showCancelButton: true,
    confirmButtonText: "Sí, anular",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c0392b",
    cancelButtonColor: "#6b7280",
    background: isDark.value ? "#1f2937" : "#fff",
    color: isDark.value ? "#f3f4f6" : "#111827",
  });
  if (!result.isConfirmed || !puedeGestionarSeguros.value || seguroGuardando.value) return;

  seguroGuardando.value = true;
  try {
    await segurosStore.anular(item.id);
    await segurosStore.fetchSeguros();
    toastSuccess("Seguro anulado");
  } catch (e) {
    await mostrarErrorSeguro(e, "No se pudo anular el seguro.");
  } finally {
    seguroGuardando.value = false;
  }
}

async function mostrarErrorSeguro(e, fallback) {
  const status = e.response?.status;
  let mensaje = mensajeErrorApi(e, fallback);
  if (status === 403) mensaje = "No tienes permiso para realizar esta acción sobre seguros.";
  if (status === 404) mensaje = "El seguro no fue encontrado.";
  if (status === 409 && !mensaje)
    mensaje = "El seguro ya no puede modificarse porque existe un conflicto de estado.";
  await Swal.fire({
    icon: "error",
    title: status === 403 ? "Acceso denegado" : "No se pudo completar la operación",
    text: mensaje,
    confirmButtonColor: "#c0392b",
    background: isDark.value ? "#1f2937" : "#fff",
    color: isDark.value ? "#f3f4f6" : "#111827",
  });
}

async function cargarModelos() {
  cargandoModelos.value = true;
  try {
    // fetchAllPaginated trae TODAS las páginas; usar solo la primera página
    // (como antes) dejaba "modelos_count" incompleto en Marcas cuando había
    // más de una página de modelos.
    const { items } = await fetchAllPaginated((params) => api.get("/admin/modelos", { params }));
    modelos.value = items;
  } catch {
    modelos.value = [];
  } finally {
    cargandoModelos.value = false;
  }
}

async function guardarVehiculo(form) {
  if (!puedeGestionarVehiculos.value) return;
  try {
    if (modoEdicion.value) {
      await store.actualizar(form);
      await cargarVehiculos();
      toastSuccess("Vehículo actualizado");
    } else {
      await store.crear(form);
      await cargarVehiculos(1);
      toastSuccess("Vehículo registrado");
    }
    store.fetchTodosVehiculos(true);
    modalAbierto.value = false;
  } catch (e) {
    if (vehiculoModalRef.value?.aplicarErroresBackend?.(e)) return;
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: mensajeErrorApi(e, store.error || "No se pudo guardar el vehículo."),
      confirmButtonColor: "#c0392b",
      background: isDark.value ? "#1f2937" : "#fff",
      color: isDark.value ? "#f3f4f6" : "#111827",
    });
  }
}
</script>

<style scoped>
.estado-badge {
  min-height: 2.25rem;
  border-radius: 9999px;
  padding: 0.35rem 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  min-width: 8.5rem;
}
.catalogo-table {
  border-collapse: separate;
  border-spacing: 0;
}
.catalogo-tab-active {
  background: #922b21;
  color: #fff;
  box-shadow: 0 2px 8px rgba(146, 43, 33, 0.35);
}
.catalogo-tab-inactive-light {
  color: #4b5563;
}
.catalogo-tab-inactive-light:hover {
  background: #f3f4f6;
  color: #111827;
}
.catalogo-tab-inactive-dark {
  color: #9ca3af;
}
.catalogo-tab-inactive-dark:hover {
  background: #1f2937;
  color: #f3f4f6;
}
.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.15s ease;
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.pagination-btn-light {
  color: #334155;
  background: #ffffff;
  border-color: #dbe3ed;
}

.pagination-btn-light:not(:disabled):hover {
  color: #c0392b;
  background: #fff7f5;
  border-color: #fecaca;
}

.pagination-btn-dark {
  color: #d1d5db;
  background: #111827;
  border-color: #374151;
}

.pagination-btn-dark:not(:disabled):hover {
  color: #f0a500;
  background: #1f2937;
  border-color: #4b5563;
}

.pagination-page {
  min-width: 6.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
