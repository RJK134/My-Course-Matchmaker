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
