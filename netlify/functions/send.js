import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// === Ligar ao Supabase ===
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// === Função principal ===
export async function handler(event) {
  try {
    const data = JSON.parse(event.body);
    const produto = data.produto || {};

    // === Enviar Email ===
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

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
        <p><b>Observações:</b> ${data.observacoes ?? "-"}</p>

        <hr>
        <h4>📑 Produto Reservado</h4>
        <p><b>Nome:</b> ${produto.nome}</p>
        <p><b>Comprimento:</b> ${produto.comprimento ?? "-"}</p>
        <p><b>Largura:</b> ${produto.largura ?? "-"}</p>
        <p><b>Tipo:</b> ${produto.tipo}</p>
        <p><b>Observações:</b>${produto.observacoes ?? "-"}</p>
        ${produto.foto ? `<img src="${produto.foto}" style="max-width:300px;border-radius:6px;">` : ""}
      `,
    };

    await transporter.sendMail(mailOptions);

    // === Atualizar produto no Supabase ===
    await supabase
      .from("items")
      .update({
        estado: "off",
        data_off: new Date().toISOString(),
      })
      .eq("id", produto.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ Pedido enviado com sucesso e produto reservado!" }),
    };
  } catch (err) {
    console.error("Erro:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "❌ Erro ao enviar a mensagem." }),
    };
  }
}
