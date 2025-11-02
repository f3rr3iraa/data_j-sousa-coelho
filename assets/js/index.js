// === Supabase Config ===
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

  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
}

// === Variáveis globais ===
let currentPage = 1;
let itemsPerPage = 100;
let totalItems = 0;
let totalPages = 1;

// === Estado atual dos filtros ===
let filtros = {
  marca: "",
  nome: "",
  tipo: ""
};

// === Buscar e preencher marcas ===
async function carregarMarcas() {
  const { data, error } = await supabaseClient
    .from("items")
    .select("nome");

  if (error) {
    console.error("Erro ao carregar marcas:", error);
    return;
  }

  const marcas = data
    .map(i => i.nome?.split(" ")[0]?.trim())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i); // remover duplicados

  // Se houver "dekton" e "Dekton", mantém só a com maiúscula
  const marcasUnicas = marcas.filter(m => {
    const hasUpper = marcas.includes(m.charAt(0).toUpperCase() + m.slice(1));
    return !/^[a-z]/.test(m) || !hasUpper;
  }).sort();

  const select = document.getElementById("filtroMarca");
  if (!select) return;

  marcasUnicas.forEach(marca => {
    const opt = document.createElement("option");
    opt.value = marca;
    opt.textContent = marca;
    select.appendChild(opt);
  });
}

// === Botão "Limpar Filtros" ===
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
if (btnLimparFiltros) {
  btnLimparFiltros.addEventListener("click", () => {
    // resetar valores
    filtros = { marca: "", nome: "", tipo: "" };
    document.getElementById("filtroMarca").value = "";
    document.getElementById("filtroNome").value = "";
    document.getElementById("filtroTipo").value = "";

    // voltar para primeira página
    currentPage = 1;

    // recarregar os dados
    initHomeSupabaseSimplificada();

    // feedback visual
    showToast("Filtros limpos!", "info");
  });
}

// === Carregar produtos ON com paginação e filtros ===
async function initHomeSupabaseSimplificada(filtroEstado = 'on') {
  try {
    const tableBody = document.getElementById("itemsBody");
    if (!tableBody) return;
    tableBody.innerHTML = `<tr><td colspan="8">A carregar dados...</td></tr>`;

    // Calcular intervalo de dados
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    const orderField = filtroEstado === 'off' ? 'data_off' : 'id';

    // Contar total de registos
    const { count } = await supabaseClient
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("estado", filtroEstado);

    totalItems = count ?? 0;
    totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // === Aplicar filtros ===
    let query = supabaseClient
      .from("items")
      .select("*")
      .eq("estado", filtroEstado);

    if (filtros.marca) query = query.ilike("nome", `${filtros.marca}%`);
    if (filtros.nome) query = query.ilike("nome", `%${filtros.nome}%`);
    if (filtros.tipo) query = query.eq("tipo", filtros.tipo);

    query = query
      .order(orderField, { ascending: false })
      .range(from, to);

    const { data, error } = await query;

    if (error) {
      tableBody.innerHTML = `<tr><td colspan="8">Erro ao carregar dados: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8">Nenhum produto encontrado.</td></tr>`;
      return;
    }

    // Renderizar tabela
    tableBody.innerHTML = data.map(item => `
      <tr data-id="${item.id}">
        ${filtroEstado === 'on' ? `
        <td><button class="btn btn-sm btn-reserve btn-reversar">Reservar</button></td>` : ""}
        <td>${item.nome ?? "-"}</td>
        <td>${item.comprimento ?? "-"}</td>
        <td>${item.largura ?? "-"}</td>
        <td>${item.tipo ?? "-"}</td>
        <td>${item.foto ? `<img src="${item.foto}" alt="foto" style="max-width:100px;height:60px;object-fit:cover;border-radius:4px;">` : "-"}</td>
        <td>${item.observacoes ?? ""}</td>
        ${filtroEstado === 'off' ? `<td>${item.data_off ? new Date(item.data_off).toLocaleString("pt-PT") : "-"}</td>` : ""}
      </tr>
    `).join("");

    // Atualizar indicador de página
    document.getElementById("pageIndicator").textContent = `${currentPage} / ${totalPages}`;

    // Atualizar estado dos botões
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;

    // Botão reservar
    if (filtroEstado === 'on') {
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
            <h5><strong>Produto</strong></h5>
            <p><strong>Nome:</strong> ${item.nome}</p>
            <p><strong>Comprimento:</strong> ${item.comprimento}</p>
            <p><strong>Largura:</strong> ${item.largura}</p>
            <p><strong>Tipo:</strong> ${item.tipo}</p>
            <p><strong>Observações:</strong> ${item.observacoes ?? "-"}</p>
            ${item.foto ? `<img src="${item.foto}" class="img-fluid rounded" alt="foto" style="height: 325px; width: auto;">` : ""}
          `;
          new bootstrap.Modal(document.getElementById("reserveModal")).show();
        });
      });
    }

  } catch (err) {
    console.error(err);
    const tableBody = document.getElementById("itemsBody");
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="8">Erro inesperado ao carregar dados.</td></tr>`;
  }
}

// === Controlos de paginação ===
document.addEventListener("DOMContentLoaded", async () => {
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const itemsSelect = document.getElementById("itemsPerPage");

  // carregar marcas e produtos iniciais
  await carregarMarcas();
  await initHomeSupabaseSimplificada();

  // eventos de paginação
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        initHomeSupabaseSimplificada();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        initHomeSupabaseSimplificada();
      }
    });
  }

  if (itemsSelect) {
    itemsSelect.addEventListener("change", (e) => {
      itemsPerPage = parseInt(e.target.value);
      currentPage = 1;
      initHomeSupabaseSimplificada();
    });
  }

  // eventos dos filtros
  const filtroMarca = document.getElementById("filtroMarca");
  const filtroNome = document.getElementById("filtroNome");
  const filtroTipo = document.getElementById("filtroTipo");

  if (filtroMarca) {
    filtroMarca.addEventListener("change", e => {
      filtros.marca = e.target.value;
      currentPage = 1;
      initHomeSupabaseSimplificada();
    });
  }

  if (filtroNome) {
    filtroNome.addEventListener("input", e => {
      filtros.nome = e.target.value.trim();
      currentPage = 1;
      initHomeSupabaseSimplificada();
    });
  }

  if (filtroTipo) {
    filtroTipo.addEventListener("change", e => {
      filtros.tipo = e.target.value;
      currentPage = 1;
      initHomeSupabaseSimplificada();
    });
  }

  // === Botão "Limpar Filtros" ===
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
if (btnLimparFiltros) {
  btnLimparFiltros.addEventListener("click", () => {
    // resetar valores
    filtros = { marca: "", nome: "", tipo: "" };
    document.getElementById("filtroMarca").value = "";
    document.getElementById("filtroNome").value = "";
    document.getElementById("filtroTipo").value = "";

    // voltar para primeira página
    currentPage = 1;

    // recarregar os dados
    initHomeSupabaseSimplificada();

  });
}

});

// === Enviar formulário de reserva ===
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
        await supabaseClient
          .from("items")
          .update({
            estado: "off",
            data_off: new Date().toISOString()
          })
          .eq("id", produtoSelecionado.id);

        const modalEl = document.getElementById("reserveModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        form.querySelectorAll("input, textarea").forEach(el => el.value = "");
        showToast("✅ Pedido enviado com sucesso e produto reservado!", "success");
        initHomeSupabaseSimplificada('on');
      } else {
        showToast("❌ Erro ao enviar o pedido.", "danger");
      }
    } catch (error) {
      console.error(error);
      showToast("⚠️ Falha na ligação ao servidor.", "warning");
    }
  });
});

// === Modal de imagem ===
document.addEventListener("click", (e) => {
  const img = e.target.closest("img");
  if (img && img.src && img.closest("table, #reserveProductInfo")) {
    const modalImg = document.getElementById("modalImgView");
    modalImg.src = img.src;

    const modal = new bootstrap.Modal(document.getElementById("modalImg"));
    modal.show();
  }
});

window.initHomeSupabaseSimplificada = initHomeSupabaseSimplificada;
