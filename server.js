// server.js
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("assets"));
app.use(express.static("."));

// === CONFIGURAÇÃO SUPABASE ===
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// === ROTA: obter produtos ===
app.get("/api/items", async (req, res) => {
  try {
    const filtroEstado = req.query.estado || "on";
    const orderField = filtroEstado === "off" ? "data_off" : "id";

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("estado", filtroEstado)
      .order(orderField, { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro inesperado ao carregar dados" });
  }
});

// === ROTA: reservar produto ===
app.post("/api/reservar", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID do produto ausente" });

    const { error } = await supabase
      .from("items")
      .update({
        estado: "off",
        data_off: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// === ENVIO DE EMAIL via SAPO ===
async function sendMail(data) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const produto = data.produto || {};
  const mailOptions = {
    from: `"${data.nome} - ${data.empresa}" <${process.env.SMTP_USER}>`,
    replyTo: data.email,
    to: process.env.SMTP_USER,
    subject: `Reserva da Referência - ${produto.id} | ${produto.nome}`,
    html: `
      <h3>📦 Novo Pedido de Reserva</h3>
      <p><b>Referência:</b> ${produto.id}</p>
      <p><b>Nome:</b> ${data.nome}</p>
      <p><b>Empresa:</b> ${data.empresa}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Telefone:</b> ${data.telefone}</p>
      <p><b>Observações:</b>${data.observacoes}</p>
      <hr>
      <h4>📑 Produto Reservado</h4>
      <p><b>Nome:</b> ${produto.nome}</p>
      <p><b>Comprimento:</b> ${produto.comprimento ?? "-"}</p>
      <p><b>Largura:</b> ${produto.largura ?? "-"}</p>
      <p><b>Tipo:</b> ${produto.tipo}</p>
      <p><b>Observações:</b>${produto.observacoes ?? "-"}</p>
      ${produto.foto ? `<img src="${produto.foto}" style="max-width:300px;border-radius:6px;">` : ""}
      <hr>
    `,
  };

  await transporter.sendMail(mailOptions);
}

app.post("/send", async (req, res) => {
  try {
    await sendMail(req.body);
    res.status(200).send("Mensagem enviada com sucesso!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao enviar a mensagem.");
  }
});

// === PÁGINA INICIAL ===
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.listen(3000, () =>
  console.log("✅ Servidor a correr em: http://localhost:3000")
);
