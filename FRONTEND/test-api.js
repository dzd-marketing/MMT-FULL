fetch('http://localhost:3000/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: ["Highest Quality Services", "Real results, no bots"], to: "si" })
}).then(res => res.json()).then(console.log).catch(console.error);
