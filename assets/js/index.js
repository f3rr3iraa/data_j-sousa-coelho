// supabase.js
const supabaseUrl = 'https://jipdtttjsmyllnaqggwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcGR0dHRqc215bGxuYXFnZ3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUzOTIsImV4cCI6MjA3Njc0MTM5Mn0.twAKANHX3L6NlKIli4amXKG-_GGD04BCQSbjm_uNCwE';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let produtoSelecionado = null;

// === Mostrar toast dinâmico ===
function showToast(message, type = "primary") {
  const toastEl = document.getElementById("liveToast");
  const toastBody = document.getElementById("toastMessage");

  toastBody.textContent = message;
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;

  const toast = new bootstrap.Toast(toastEl, { delay: 4000 }); // fecha após 4s
  toast.show();
}

async function initHomeSupabaseSimplificada() {
  try {
    const tableBody = document.getElementById("itemsBody");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8">A carregar dados...</td></tr>`;

    const { data, error } = await supabaseClient
      .from("items")
      .select("*")
      .eq("estado", "on")
      .order("id", { ascending: false });

    if (error) {
      tableBody.innerHTML = `<tr><td colspan="8">Erro ao carregar dados: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8">Nenhum item encontrado.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.map(item => `
      <tr data-id="${item.id}">
        <td>
          <button class="btn btn-sm btn-reserve btn-reversar">Reservar</button>
        </td>
        <td>${item.nome}</td>
        <td>${item.comprimento ?? "-"}</td>
        <td>${item.largura ?? "-"}</td>
        <td>${item.tipo}</td>
        <td>
          ${item.foto 
            ? `<img src="${item.foto}" alt="foto" style="max-width:100px;height:60px;object-fit:cover;border-radius:4px;">`
            : "-"
          }
        </td>
        <td>${item.observacoes ?? ""}</td>
      </tr>
    `).join("");

    document.querySelectorAll(".btn-reversar").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const row = e.target.closest("tr");
        const id = row.getAttribute("data-id");

        const { data: item } = await supabaseClient
          .from("items")
          .select("*")
          .eq("id", id)
          .single();

        if (!item) return showToast("Erro: produto não encontrado!", "danger");

        produtoSelecionado = item;

        const infoDiv = document.getElementById("reserveProductInfo");
        infoDiv.innerHTML = `
          <h5>${item.nome}</h5>
          <p><strong>Comprimento:</strong> ${item.comprimento ?? "-"}</p>
          <p><strong>Largura:</strong> ${item.largura ?? "-"}</p>
          <p><strong>Tipo:</strong> ${item.tipo}</p>
          <p><strong>Observações:</strong> ${item.observacoes ?? "-"}</p>
          ${item.foto ? `<img src="${item.foto}" class="img-fluid rounded" alt="foto">` : ""}
        `;

        const reserveModal = new bootstrap.Modal(document.getElementById("reserveModal"));
        reserveModal.show();
      });
    });

  } catch (err) {
    console.error(err);
    const tableBody = document.getElementById("itemsBody");
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="8">Erro inesperado ao carregar dados.</td></tr>`;
  }
}

// === Enviar formulário ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target).entries());

    if (!produtoSelecionado) {
      showToast("Erro: Nenhum produto selecionado!", "danger");
      return;
    }

    const dadosCompletos = {
      ...formData,
      produto: produtoSelecionado,
    };

    try {
      const res = await fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosCompletos),
      });

      if (res.ok) {
        // Atualizar produto para "off"
        await supabaseClient
          .from("items")
          .update({ estado: "off" })
          .eq("id", produtoSelecionado.id);

        // Fechar modal
        const modalEl = document.getElementById("reserveModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Mostrar toast de sucesso
        showToast("✅ Pedido enviado com sucesso e produto reservado!", "success");

        // Recarregar lista
        initHomeSupabaseSimplificada();
      } else {
        showToast("❌ Erro ao enviar o pedido.", "danger");
      }
    } catch (error) {
      console.error(error);
      showToast("⚠️ Falha na ligação ao servidor.", "warning");
    }
  });
});

window.initHomeSupabaseSimplificada = initHomeSupabaseSimplificada;
