export default function formatDate(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${year} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
