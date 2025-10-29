const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("assets"));
app.use(express.static("."));

// Envio de email via SAPO
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
    from: `"Reserva de Produto" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER,
    subject: `Reserva - ${produto.nome || "Produto"} (${data.nome})`,
    html: `
      <h3>📦 Novo Pedido de Reserva</h3>
      <p><b>Nome:</b> ${data.nome}</p>
      <p><b>Empresa:</b> ${data.empresa || "Não especificada"}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Telefone:</b> ${data.telefone || "Não fornecido"}</p>
      <p><b>Observações:</b><br>${data.observacoes || "(nenhuma)"}</p>

      <hr>

      <h4>🪵 Produto Reservado</h4>
      <p><b>Nome:</b> ${produto.nome}</p>
      <p><b>Comprimento:</b> ${produto.comprimento ?? "-"}</p>
      <p><b>Largura:</b> ${produto.largura ?? "-"}</p>
      <p><b>Tipo:</b> ${produto.tipo}</p>
      <p><b>Observações:</b> ${produto.observacoes ?? "-"}</p>
      ${produto.foto ? `<img src="${produto.foto}" style="max-width:300px;border-radius:6px;">` : ""}

      <hr>
      <small>Este produto foi automaticamente colocado em estado <b>"off"</b> após a reserva.</small><br>
      <small>Enviado automaticamente para ${process.env.SMTP_USER} (sapo.pt)</small>
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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.listen(3000, () =>
  console.log("✅ Servidor a correr em: http://localhost:3000")
);
