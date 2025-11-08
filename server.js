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
  const marcaenomeeespessura = `${produto.marca ?? ""} - ${produto.nome ?? ""} ${produto.espessura ?? ""}`;
  const mailOptions = {
  from: `"${data.nome} - ${data.empresa}" <${process.env.SMTP_USER}>`,
  replyTo: data.email,
  to: process.env.SMTP_USER,
  subject: `Reserva da Referência - ${produto.id} | ${marcaenomeeespessura}`,
  html: `
    <h3>📦 Novo Pedido de Reserva</h3>
    <p><b>Referência:</b> ${produto.id}</p>
    <p><b>Nome:</b> ${data.nome}</p>
    <p><b>Empresa:</b> ${data.empresa}</p>
    <p><b>Email:</b> ${data.email}</p>
    <p><b>Telefone:</b> ${data.telefone}</p>
    <p><b>Observação:</b>${data.observacoes}</p>

    <hr>

    <h4>📑 Produto Reservado</h4>
    <p><b>Nome/Marca:</b> ${marcaenomeeespessura}</p>
    <p><b>Comprimento:</b> ${produto.comprimento ?? ""}</p>
    <p><b>Largura:</b> ${produto.largura ?? ""}</p>
    <p><b>Lote:</b> ${produto.lote ?? ""}</p>
    <p><b>Tipo:</b> ${produto.tipo ?? ""} </p>
    <p><b>Observação:</b>${produto.observacoes ?? ""}</p>
    ${produto.foto ? `<img src="${produto.foto}" style="max-width:300px;">` : ""}

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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.listen(3001, () =>
  console.log("✅ Servidor a correr em: http://localhost:3001")
);
