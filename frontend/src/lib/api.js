const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

export const api = {
  // Public endpoints
  courses: {
    list: (filters = {}) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v != null && v !== "") params.set(k, v);
      }
      const qs = params.toString();
      return fetchJson(`/courses${qs ? `?${qs}` : ""}`);
    },
    getById: (id) => fetchJson(`/courses/${id}`),
  },
  institutions: {
    list: () => fetchJson("/institutions"),
    getByKey: (key) => fetchJson(`/institutions/${key}`),
  },
  col: {
    list: () => fetchJson("/col"),
    getByCity: (city) => fetchJson(`/col/${city}`),
  },

  careers: {
    subjects: () => fetchJson("/careers/subjects"),
    forSubject: (subject) => fetchJson(`/careers/subject/${encodeURIComponent(subject)}`),
  },

  insights: {
    list: (filters = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v != null && v !== "") qs.set(k, v);
      }
      const s = qs.toString();
      return fetchJson(`/insights${s ? `?${s}` : ""}`);
    },
    types: () => fetchJson("/insights/types"),
  },

  funding: {
    list: (filters = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v != null && v !== "") qs.set(k, v);
      }
      const s = qs.toString();
      return fetchJson(`/funding${s ? `?${s}` : ""}`);
    },
    facets: () => fetchJson("/funding/facets"),
  },

  fx: {
    rate: (base, quote) => fetchJson(`/fx/rate?base=${base}&quote=${quote}`),
    convert: (amount, from, to) => fetchJson(`/fx/convert?amount=${amount}&from=${from}&to=${to}`),
  },

  search: {
    query: (params = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v != null && v !== "") qs.set(k, v);
      }
      return fetchJson(`/search?${qs.toString()}`);
    },
    health: () => fetchJson("/search/health"),
  },

  // Admin endpoints
  admin: {
    stats: () => fetchJson("/admin/stats"),
    sources: () => fetchJson("/admin/sources"),
    triggerScrape: (source) =>
      fetchJson("/admin/scrape/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      }),
    scrapeStatus: (runId) => fetchJson(`/admin/scrape/status/${runId}`),
    importScrape: (runId) =>
      fetchJson(`/admin/scrape/import/${runId}`, { method: "POST" }),
    staging: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchJson(`/admin/staging${qs ? `?${qs}` : ""}`);
    },
    approve: (id) =>
      fetchJson(`/admin/staging/${id}/approve`, { method: "PUT" }),
    reject: (id, reason) =>
      fetchJson(`/admin/staging/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }),
    bulkApprove: (ids) =>
      fetchJson("/admin/staging/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }),
    bulkReject: (ids, reason) =>
      fetchJson("/admin/staging/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, reason }),
      }),
    missingCities: () => fetchJson("/admin/cities/missing-col"),
    addCol: (data) =>
      fetchJson("/admin/col", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    latestReport: () => fetchJson("/admin/scrape/report/latest"),
  },
};
