export async function getUserId(): Promise<number | null> {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const res = await fetch("http://localhost:8000/api/profile/", {
      headers: { Authorization: `Token ${token}` }
    });
    if (!res.ok) throw new Error("Не авторизован");
    const data = await res.json();
    return data.id;
  } catch {
    return null;
  }
}
