export async function api<T>(path: string, data?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/' + path, {
      method: data === undefined ? 'GET' : 'POST',
      headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  } catch {
    throw new Error('Нет связи с сервером. Проверь интернет и попробуй ещё раз.');
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверь подключение.');
  }
  if (!response.ok)
    throw new Error((result as { error?: string }).error ?? 'Не удалось выполнить запрос.');
  return result as T;
}
