// --- INICIALIZAÇÃO DE DADOS DE TESTE ---
function inicializarDadosMock() {
    if (!localStorage.getItem("lista_alunos")) {
        const alunosIniciais = [
            { id: 1, nome: "João Silva", turma: "9º A", matricula: "12345", senha: "123" }
        ];
        localStorage.setItem("lista_alunos", JSON.stringify(alunosIniciais));
    }
    if (!localStorage.getItem("notas_geral")) {
        const notasIniciais = {
            "1": {
                "matematica": { b1: "8.5", b2: "7.0", b3: "-", b4: "-", rec: "-", faltas: "2" }
            }
        };
        localStorage.setItem("notas_geral", JSON.stringify(notasIniciais));
    }
}
inicializarDadosMock();

// --- LÓGICA DE LOGIN ---
function fazerLogin(event) {
    event.preventDefault();
    let user = document.getElementById("user").value.trim().toLowerCase();
    let pass = document.getElementById("pass").value.trim();

    // 1. Admin
    if (user === "admin" && pass === "admin123") {
        window.location.href = "admin.html";
        return;
    }

    // 2. Aluno
    let alunos = JSON.parse(localStorage.getItem("lista_alunos")) || [];
    let alunoEncontrado = alunos.find(a => a.matricula === user && a.senha === pass);
    if (alunoEncontrado) {
        localStorage.setItem("alunoLogadoId", alunoEncontrado.id);
        window.location.href = "aluno.html";
        return;
    }

    // 3. Professor (Matérias)[cite: 10]
    const profs = ["matematica", "portugues", "historia", "geografia", "ciencias"];
    if (profs.includes(user) && pass === "1234") {
        localStorage.setItem("materia", user);
        window.location.href = "dashboard.html";
        return;
    }

    let erro = document.getElementById("erro-msg");
    if (erro) {
        erro.style.display = "block";
        erro.innerText = "Credenciais inválidas!";
    }
}

// --- CARREGAR BOLETIM DO ALUNO (Com Faltas) ---
if (document.getElementById("tabelaBoletim")) {
    window.onload = function() {
        let alunoId = localStorage.getItem("alunoLogadoId");
        if (!alunoId) { window.location.href = "index.html"; return; }

        let alunos = JSON.parse(localStorage.getItem("lista_alunos")) || [];
        let aluno = alunos.find(a => a.id == alunoId);
        if (aluno) {
            document.getElementById("nomeAlunoTitulo").innerText = `Olá, ${aluno.nome}`;
            document.getElementById("spanMatricula").innerText = aluno.matricula;
            document.getElementById("spanTurma").innerText = aluno.turma || "Geral";
        }

        let todasNotas = JSON.parse(localStorage.getItem("notas_geral")) || {};
        let notasAluno = todasNotas[alunoId] || {};
        let materias = {
            matematica: "📊 Matemática", portugues: "📖 Português",
            historia: "🏛️ História", geografia: "🌎 Geografia", ciencias: "🔬 Ciências"
        };

        let tabela = document.getElementById("tabelaBoletim");
        tabela.innerHTML = "";
        for (let m in materias) {
            let n = notasAluno[m] || { b1: "-", b2: "-", b3: "-", b4: "-", rec: "-", faltas: "0" };
            tabela.innerHTML += `
                <tr>
                    <td style="font-weight: 600;">${materias[m]}</td>
                    <td>${n.b1 || "-"}</td><td>${n.b2 || "-"}</td><td>${n.b3 || "-"}</td><td>${n.b4 || "-"}</td>
                    <td style="color: #d97706; font-weight: bold;">${n.rec || "-"}</td>
                    <td style="color: #ef4444; font-weight: bold;">${n.faltas || "0"}</td>
                </tr>
            `;
        }
    }
}

// --- ADMIN: CADASTRAR E REMOVER ---
function cadastrarAluno(event) {
    event.preventDefault();
    let nome = document.getElementById("admNome").value.trim();
    let turma = document.getElementById("admTurma").value.trim();
    let matricula = document.getElementById("admMatricula").value.trim();
    let senha = document.getElementById("admSenha").value.trim();

    let alunos = JSON.parse(localStorage.getItem("lista_alunos")) || [];
    if (alunos.some(a => a.matricula === matricula)) {
        alert("Esta matrícula já está registada!");
        return;
    }

    let novoId = alunos.length > 0 ? Math.max(...alunos.map(a => a.id)) + 1 : 1;
    alunos.push({ id: novoId, nome, turma, matricula, senha });
    localStorage.setItem("lista_alunos", JSON.stringify(alunos));

    alert("Aluno e turma criados com sucesso!");
    document.getElementById("admNome").value = "";
    document.getElementById("admTurma").value = "";
    document.getElementById("admMatricula").value = "";
    document.getElementById("admSenha").value = "";
    mostrarAbaAdmin('listar');
}

function mostrarAbaAdmin(aba) {
    document.getElementById("aba-cadastrar").classList.add("hidden");
    document.getElementById("aba-listar").classList.add("hidden");
    document.getElementById(`aba-${aba}`).classList.remove("hidden");
    if (aba === 'listar') atualizarTabelaAdmin();
}

function atualizarTabelaAdmin() {
    let alunos = JSON.parse(localStorage.getItem("lista_alunos")) || [];
    let tabela = document.getElementById("tabelaAlunosAdmin");
    if (!tabela) return;
    tabela.innerHTML = "";
    if (alunos.length === 0) {
        tabela.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhum aluno registado.</td></tr>`;
        return;
    }
    alunos.forEach(a => {
        tabela.innerHTML += `
            <tr>
                <td>${a.nome}</td><td>${a.turma}</td><td><strong>${a.matricula}</strong></td>
                <td><button onclick="removerAluno(${a.id})" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:5px; cursor:pointer;">❌ Excluir</button></td>
            </tr>
        `;
    });
}

function removerAluno(id) {
    if (confirm("Tem certeza que deseja remover este aluno?")) {
        let alunos = JSON.parse(localStorage.getItem("lista_alunos")) || [];
        alunos = alunos.filter(a => a.id !== id);
        localStorage.setItem("lista_alunos", JSON.stringify(alunos));
        atualizarTabelaAdmin();
    }
}

// --- PROFESSOR: TURMAS E NOTAS/FALTAS ---
if (document.getElementById("filtroTurma")) {
    window.onload = function() {
        let alunos = JSON.parse(localStorage.getItem("lista_alunos")) || [];
        let turmas = [...new Set(alunos.map(a => a.turma))].filter(Boolean);
        let select = document.getElementById("filtroTurma");
        select.innerHTML = `<option value="">Selecione uma turma...</option>`;
        turmas.forEach(t => { select.innerHTML += `<option value="${t}">${t}</option>`; });
    };
}

function carregarAlunosPorTurma() {
    let turma = document.getElementById("filtroTurma").value;
    let alunos = JSON.parse(localStorage.getItem("lista_alunos")) || [];
    let tabela = document.getElementById("tabelaAlunosTurma");
    tabela.innerHTML = "";
    let filtrados = alunos.filter(a => a.turma === turma);
    if (filtrados.length === 0) {
        tabela.innerHTML = `<tr><td colspan="3" style="text-align: center;">Nenhum aluno nesta turma.</td></tr>`;
        return;
    }
    filtrados.forEach(a => {
        tabela.innerHTML += `
            <tr>
                <td>${a.nome}</td><td>${a.matricula}</td>
                <td><button onclick="abrirLancamento(${a.id}, '${a.nome}')" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">📝 Notas/Faltas</button></td>
            </tr>
        `;
    });
}

function mostrarSecaoProf(secao) {
    document.getElementById("secao-turmas").classList.add("hidden");
    document.getElementById("secao-notas").classList.add("hidden");
    document.getElementById(`secao-${secao}`).classList.remove("hidden");
}

function abrirLancamento(id, nome) {
    document.getElementById("alunoIdNota").value = id;
    document.getElementById("nomeAlunoNota").value = nome;
    mostrarSecaoProf("notas");
}

function salvarNotaProfessor(event) {
    event.preventDefault();
    let id = document.getElementById("alunoIdNota").value;
    let bim = document.getElementById("bimestreProf").value;
    let nota = document.getElementById("notaProf").value || "-";
    let faltas = document.getElementById("faltasProf").value || "0";
    let materia = localStorage.getItem("materia") || "matematica";

    let notasGeral = JSON.parse(localStorage.getItem("notas_geral")) || {};
    if (!notasGeral[id]) notasGeral[id] = {};
    if (!notasGeral[id][materia]) notasGeral[id][materia] = { b1: "-", b2: "-", b3: "-", b4: "-", rec: "-", faltas: "0" };

    notasGeral[id][materia][bim] = nota;
    notasGeral[id][materia].faltas = faltas;
    localStorage.setItem("notas_geral", JSON.stringify(notasGeral));

    alert("Registo guardado com sucesso!");
    document.getElementById("notaProf").value = "";
    document.getElementById("faltasProf").value = "";
    mostrarSecaoProf("turmas");
}

function limparDadosAluno() {
    let id = document.getElementById("alunoIdNota").value;
    let materia = localStorage.getItem("materia") || "matematica";
    let notasGeral = JSON.parse(localStorage.getItem("notas_geral")) || {};
    if (notasGeral[id] && notasGeral[id][materia]) {
        notasGeral[id][materia] = { b1: "-", b2: "-", b3: "-", b4: "-", rec: "-", faltas: "0" };
        localStorage.setItem("notas_geral", JSON.stringify(notasGeral));
        alert("Dados e notas retirados com sucesso!");
    }
    mostrarSecaoProf("turmas");
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// --- INICIALIZAÇÃO DE DADOS DE TURMAS ---
function inicializarTurmasMock() {
    if (!localStorage.getItem("lista_turmas")) {
        const turmasIniciais = [
            { nome: "9º A", professor: "matematica" },
            { nome: "9º B", professor: "portugues" }
        ];
        localStorage.setItem("lista_turmas", JSON.stringify(turmasIniciais));
    }
}
inicializarTurmasMock();

// --- FUNÇÕES DO ADMIN PARA TURMAS ---
if (document.getElementById("listaTurmasCadastradas")) {
    window.onload = function() {
        atualizarListaTurmasAdmin();
        carregarSelectTurmasAdmin();
    };
}

function cadastrarTurma(event) {
    event.preventDefault();
    let nomeTurma = document.getElementById("nomeTurma").value.trim();
    let professor = document.getElementById("professorRegente").value;

    let turmas = JSON.parse(localStorage.getItem("lista_turmas")) || [];
    if (turmas.some(t => t.nome.toLowerCase() === nomeTurma.toLowerCase())) {
        alert("Esta turma já está registada!");
        return;
    }

    turmas.push({ nome: nomeTurma, professor: professor });
    localStorage.setItem("lista_turmas", JSON.stringify(turmas));

    alert("Turma criada com sucesso!");
    document.getElementById("nomeTurma").value = "";
    document.getElementById("professorRegente").value = "";
    atualizarListaTurmasAdmin();
    carregarSelectTurmasAdmin();
}

function atualizarListaTurmasAdmin() {
    let turmas = JSON.parse(localStorage.getItem("lista_turmas")) || [];
    let lista = document.getElementById("listaTurmasCadastradas");
    if (!lista) return;

    lista.innerHTML = "";
    if (turmas.length === 0) {
        lista.innerHTML = `<li style="color: #64748b;">Nenhuma turma registada.</li>`;
        return;
    }

    turmas.forEach((t, index) => {
        lista.innerHTML += `
            <li style="background: rgba(255,255,255,0.7); padding: 10px 15px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span>🏫 <strong>${t.nome}</strong> (Regente: <em>${t.professor}</em>)</span>
                <button onclick="removerTurma(${index})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">❌</button>
            </li>
        `;
    });
}

function removerTurma(index) {
    if (confirm("Tem certeza que deseja remover esta turma?")) {
        let turmas = JSON.parse(localStorage.getItem("lista_turmas")) || [];
        turmas.splice(index, 1);
        localStorage.setItem("lista_turmas", JSON.stringify(turmas));
        atualizarListaTurmasAdmin();
        carregarSelectTurmasAdmin();
    }
}

function carregarSelectTurmasAdmin() {
    let turmas = JSON.parse(localStorage.getItem("lista_turmas")) || [];
    let select = document.getElementById("admTurmaSelect");
    if (!select) return;

    select.innerHTML = `<option value="">Escolha a turma...</option>`;
    turmas.forEach(t => {
        select.innerHTML += `<option value="${t.nome}">${t.nome}</option>`;
    });
}

function mostrarAbaAdmin(aba) {
    document.getElementById("aba-turmas").classList.add("hidden");
    document.getElementById("aba-cadastrar").classList.add("hidden");
    document.getElementById("aba-listar").classList.add("hidden");
    document.getElementById(`aba-${aba}`).classList.remove("hidden");

    if (aba === 'turmas') {
        atualizarListaTurmasAdmin();
    } else if (aba === 'cadastrar') {
        carregarSelectTurmasAdmin();
    } else if (aba === 'listar') {
        atualizarTabelaAdmin();
    }
}

// --- ATUALIZAÇÃO NO PAINEL DO PROFESSOR (Carregar todas as turmas criadas) ---
if (document.getElementById("filtroTurma")) {
    window.onload = function() {
        let turmas = JSON.parse(localStorage.getItem("lista_turmas")) || [];
        let select = document.getElementById("filtroTurma");
        if (!select) return;

        select.innerHTML = `<option value="">Selecione uma turma...</option>`;
        turmas.forEach(t => {
            select.innerHTML += `<option value="${t.nome}">${t.nome}</option>`;
        });
    };
}