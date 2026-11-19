// Envia o link de redefinição de senha ao usuário.
// O SMTP é opcional: sem as variáveis SMTP_*, o link aparece no console (somente fora de produção).

let transporte;

// O SMTP só é usado quando todas as variáveis obrigatórias estão preenchidas.
function smtpConfigurado() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && MAIL_FROM);
}

// O nodemailer é carregado só quando necessário, então o projeto roda sem ele no modo de console.
async function obterTransporte() {
  if (!transporte) {
    const { default: nodemailer } = await import("nodemailer");
    const porta = Number(process.env.SMTP_PORT) || 587;

    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: porta,
      // A porta 465 usa TLS direto; as demais (como a 587) iniciam em texto e sobem para STARTTLS.
      secure: porta === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }

  return transporte;
}

export async function enviarEmailRedefinicao({ para, link }) {
  if (smtpConfigurado()) {
    const smtp = await obterTransporte();

    await smtp.sendMail({
      from: process.env.MAIL_FROM,
      to: para,
      subject: "Redefinição de senha",
      text: [
        "Recebemos um pedido para redefinir a senha da sua conta.",
        "",
        `Acesse o link abaixo em até 15 minutos: ${link}`,
        "",
        "Se você não fez esse pedido, ignore este e-mail. Sua senha continua a mesma."
      ].join("\n"),
      html: `
        <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
        <p><a href="${link}">Redefinir minha senha</a></p>
        <p>O link vale por 15 minutos e só pode ser usado uma vez.</p>
        <p>Se você não fez esse pedido, ignore este e-mail. Sua senha continua a mesma.</p>
      `
    });

    return;
  }

  if (process.env.NODE_ENV === "production") {
    // O link contém um token secreto, então nunca é escrito nos logs em produção.
    console.warn("SMTP não configurado: o link de redefinição não foi enviado.");
    return;
  }

  console.log(`[DEV] Link de redefinição de senha para ${para}: ${link}`);
}
