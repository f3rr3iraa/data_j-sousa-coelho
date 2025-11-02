const res = await fetch("/.netlify/functions/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(dadosCompletos),
});
