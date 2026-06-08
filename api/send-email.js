const RESEND_KEY = process.env.RESEND_KEY;
const FROM = "Wan Hai Events — Anchors of Joy <onboarding@resend.dev>";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!RESEND_KEY) return res.status(500).json({ ok: false, error: "RESEND_KEY not configured" });

  const { to, name, pax, tableName, drawNumber, dietary, subject, body, eventInfo, qrDataUrl } = req.body || {};
  if (!to || !name) return res.status(400).json({ ok: false, error: "Missing to or name" });

  const qrBlock = qrDataUrl
    ? `<div style="text-align:center;margin:20px 0">
        <p style="margin:0 0 10px;font-size:11px;color:#8A9AB5;text-transform:uppercase;letter-spacing:2px">Your QR Code — Present at Entrance</p>
        <img src="${qrDataUrl}" alt="QR Code" width="180" height="180" style="border-radius:8px;border:3px solid #C9A84C;display:inline-block"/>
        ${drawNumber ? `<p style="margin:8px 0 0;font-family:'Courier New',monospace;font-size:18px;font-weight:900;color:#C9A84C;letter-spacing:4px">#${drawNumber}</p>` : ""}
      </div>`
    : "";

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#F2F4F8;font-family:'Helvetica Neue',sans-serif">
<div style="max-width:600px;margin:0 auto;padding:0 0 40px">
  <div style="background:linear-gradient(135deg,#001330,#0A2556);padding:36px 28px;text-align:center;border-bottom:3px solid #C9A84C">
    <h1 style="color:#C9A84C;margin:0 0 4px;font-size:28px;font-weight:900;letter-spacing:2px">⚓ Anchors of Joy</h1>
    <p style="color:rgba(255,255,255,0.6);margin:0;font-size:13px;letter-spacing:1px">A Wan Hai Family Voyage · ${eventInfo?.year||"2026"}</p>
  </div>
  <div style="background:#fff;padding:32px 28px">
    <p style="font-size:16px;color:#001330;margin:0 0 6px">Dear <strong>${name}</strong>,</p>
    <p style="color:#4A6FA5;margin:0 0 24px;font-size:14px">Thank you for confirming your attendance. We look forward to celebrating with you!</p>
    <div style="background:linear-gradient(135deg,#001330,#0A2556);border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #C9A84C">
      ${qrBlock}
      <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px">
        ${eventInfo?.date?`<p style="margin:0 0 8px;color:#fff;font-size:14px">📅 <b style="color:#C9A84C">${eventInfo.date}</b></p>`:""}
        ${eventInfo?.time?`<p style="margin:0 0 8px;color:#fff;font-size:14px">🕕 <b style="color:#C9A84C">${eventInfo.time}</b></p>`:""}
        ${eventInfo?.venue?`<p style="margin:0 0 8px;color:#fff;font-size:14px">📍 <b style="color:#C9A84C">${eventInfo.venue}</b></p>`:""}
        ${eventInfo?.dressCode?`<p style="margin:0 0 8px;color:#fff;font-size:14px">👔 <b style="color:#C9A84C">${eventInfo.dressCode}</b></p>`:""}
        <p style="margin:0 0 ${drawNumber?"8px":"0"};color:#fff;font-size:14px">👥 Pax: <b style="color:#C9A84C">${pax||1}</b></p>
        ${dietary?`<p style="margin:0;color:#fff;font-size:14px">🍽 Dietary: <b style="color:#C9A84C">${dietary}</b></p>`:""}
      </div>
    </div>
    <p style="color:#8A9AB5;font-size:13px;margin:0">Please present your QR code at the entrance for check-in.</p>
  </div>
  <div style="background:linear-gradient(135deg,#001330,#0A2556);padding:18px 28px;text-align:center;border-top:3px solid #C9A84C">
    <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0;letter-spacing:2px;text-transform:uppercase">Wan Hai Lines · We Carry, We Care.</p>
  </div>
</div>
</body></html>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject: subject || `RSVP Confirmed — Anchors of Joy ${eventInfo?.year||"2026"}`, html, text: body || subject }),
    });
    const text = await r.text();
    let d = {}; try { d = JSON.parse(text); } catch(e) {}
    if (r.ok && d.id) return res.status(200).json({ ok: true, id: d.id, to });
    console.error("Resend error:", r.status, text);
    return res.status(200).json({ ok: false, error: d.message || `Resend error ${r.status}` });
  } catch(e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
