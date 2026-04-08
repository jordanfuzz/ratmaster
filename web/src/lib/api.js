const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path) {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error ${res.status}`)
  }
  return res.json()
}

export function fetchPlayer(username) {
  return request(`/player/${encodeURIComponent(username)}`)
}

export function fetchGroup(usernames) {
  return request(`/group?usernames=${usernames.map(encodeURIComponent).join(',')}`)
}
