
const API_URL = import.meta.env.VITE_API_URL;
fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: ["Highest Quality Services", "Real results, no bots"], to: "si" })
}).then(res => res.json()).then(console.log).catch(console.error);
