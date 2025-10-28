// supabase.js
const supabaseUrl = 'https://jipdtttjsmyllnaqggwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcGR0dHRqc215bGxuYXFnZ3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUzOTIsImV4cCI6MjA3Njc0MTM5Mn0.twAKANHX3L6NlKIli4amXKG-_GGD04BCQSbjm_uNCwE';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function initHomeSupabaseSimplificada() {
  try {
    const tableBody = document.getElementById("itemsBody");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8">A carregar dados...</td></tr>`;

    // Buscar apenas items com estado 'on'
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

    // Gerar as linhas da tabela
    tableBody.innerHTML = data.map(item => `
      <tr data-id="${item.id}">
        <td>
          <button class="btn btn-sm btn-outline-warning btn-reversar" title="Mover para Ordens">
            <i class="bi bi-arrow-right-square"></i>
          </button>
        </td>
        <td>${item.nome}</td>
        <td>${item.comprimento ?? "-"}</td>
        <td>${item.largura ?? "-"}</td>
        <td>${item.tipo}</td>
        <td>${item.observacoes ?? ""}</td>
        <td>
          ${item.foto 
            ? `<img src="${item.foto}" alt="foto" style="max-width:100px;height:60px;object-fit:cover;border-radius:4px;">`
            : "-"
          }
        </td>
      </tr>
    `).join("");

    // Função do botão Reversar → muda estado para 'off'
    document.querySelectorAll(".btn-reversar").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const row = e.target.closest("tr");
        const id = row.getAttribute("data-id");

        if (!confirm("Tens a certeza que queres mover este item para Ordens?")) return;

        const { error } = await supabaseClient
          .from("items")
          .update({ estado: 'off' })
          .eq("id", id);

        if (error) {
          alert(`Erro ao mover: ${error.message}`);
        } else {
          alert("Item movido para Ordens!");
          row.remove();
        }
      });
    });

  } catch (err) {
    console.error(err);
    const tableBody = document.getElementById("itemsBody");
    if (tableBody)
      tableBody.innerHTML = `<tr><td colspan="8">Erro inesperado ao carregar dados.</td></tr>`;
  }
}

window.initHomeSupabaseSimplificada = initHomeSupabaseSimplificada;
