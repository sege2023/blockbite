// src/utils/fetchWithAuth.js
export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refresh");

  if (!options.headers) options.headers = {};
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`; // ✅ use Bearer
  }

  let response = await fetch(url, options);

  if (response.status === 401 && refreshToken) {
    const refreshRes = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("token", data.access);

      options.headers["Authorization"] = `Bearer ${data.access}`;
      response = await fetch(url, options);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
    }
  }

  return response;
}
