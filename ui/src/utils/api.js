
// const BASE_URL = import.meta.env.VITE_API_URL || '';

// type RequestOptions = {
//   method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
//   headers?: Record<string, string>;
//   body?: unknown;
//   credentials?: RequestCredentials;
// };

// export const fetchAPI = async (
//   endpoint: string,
//   { method = 'GET', headers = {}, body, credentials = 'include' }: RequestOptions = {}
// ) => {
//   const url = `${BASE_URL}${endpoint}`;
//   const response = await fetch(url, {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//       ...headers,
//     },
//     credentials,
//     // body: body ? JSON.stringify(body) : undefined,
//     body: body !== undefined ? JSON.stringify(body) : undefined,
//   });

//   // if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
//   // return response.json();
//   if (!response.ok) {
//     // Attempt to parse error body if it's JSON, otherwise use status text
//     const errorBody = await response.text(); // Get text first to avoid JSON parse errors on non-JSON
//     let errorMessage = `API Error: ${response.status} ${response.statusText}`;
//     try {
//         const jsonError = JSON.parse(errorBody);
//         errorMessage = jsonError.message || errorMessage; // Use backend message if available
//     } catch (e) {
//         // Ignore if error body isn't JSON
//     }
//     throw new Error(errorMessage);
// }
// const contentType = response.headers.get("content-type");
// if (contentType && contentType.includes("application/json")) {
//     return response.json();
// }else{
//   return{}
// }
// };