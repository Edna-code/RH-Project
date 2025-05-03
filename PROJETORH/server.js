// Importa os módulos necessários
const express = require("express"); // Framework para criar o servidor web
const sqlite3 = require("sqlite3").verbose(); // Biblioteca para trabalhar com banco de dados SQLite
const bcrypt = require("bcrypt"); // Biblioteca para criptografar senhas
const cors = require("cors"); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const bodyParser = require("body-parser"); // Middleware para processar o corpo das requisições
const path = require("path"); // Módulo para trabalhar com caminhos de arquivos

// Inicializa o aplicativo Express e o banco de dados SQLite
const app = express();
const db = new sqlite3.Database("./banco.sqlite"); // Conecta ao banco de dados SQLite
const PORT = 3000; // Define a porta onde o servidor será executado

// Middleware
app.use(cors()); // Habilita CORS para permitir requisições de outros domínios
app.use(bodyParser.json()); // Configura o servidor para processar requisições com JSON
app.use(express.static("public")); // Serve arquivos estáticos da pasta "public"

// Cria tabelas no banco de dados, caso não existam
db.serialize(() => {
  // Cria a tabela "candidatos" para armazenar informações dos candidatos
  db.run(`
    CREATE TABLE IF NOT EXISTS candidatos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- ID único para cada candidato
      nome TEXT, -- Nome do candidato
      email TEXT, -- Email do candidato
      telefone TEXT, -- Telefone do candidato
      vaga TEXT, -- Vaga para a qual o candidato está se candidatando
      curriculo TEXT -- Currículo do candidato
    )
  `);

  // Cria a tabela "admin" para armazenar informações do administrador
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- ID único para cada administrador
      senha TEXT -- Senha criptografada do administrador
    )
  `);

  // Insere um administrador padrão, caso não exista
  db.get("SELECT * FROM admin", (err, row) => {
    if (!row) {
      const senhaCriptografada = bcrypt.hashSync("123admin", 10); // Criptografa a senha padrão
      db.run("INSERT INTO admin (senha) VALUES (?)", senhaCriptografada); // Insere a senha no banco
    }
  });
});

// Rotas

// Rota para adicionar um novo candidato
app.post("/candidatos", (req, res) => {
  const { nome, email, telefone, vaga, curriculo } = req.body; // Extrai os dados do corpo da requisição
  db.run(
    "INSERT INTO candidatos (nome, email, telefone, vaga, curriculo) VALUES (?, ?, ?, ?, ?)",
    [nome, email, telefone, vaga, curriculo], // Insere os dados no banco
    function (err) {
      if (err) return res.status(500).json({ erro: err.message }); // Retorna erro, se houver
      res.status(201).json({ id: this.lastID }); // Retorna o ID do candidato inserido
    }
  );
});

// Rota para listar todos os candidatos
app.get("/candidatos", (req, res) => {
  db.all("SELECT * FROM candidatos", (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message }); // Retorna erro, se houver
    res.json(rows); // Retorna todos os candidatos
  });
});

// Rota para servir a página de administração
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html")); // Envia o arquivo HTML da página de admin
});

// Rota para login do administrador
app.post("/login", (req, res) => {
  const { senha } = req.body; // Extrai a senha do corpo da requisição
  db.get("SELECT * FROM admin", (err, row) => {
    if (!row) return res.status(401).json({ erro: "Admin não cadastrado" }); // Verifica se o admin existe
    const senhaValida = bcrypt.compareSync(senha, row.senha); // Compara a senha fornecida com a armazenada
    if (!senhaValida) return res.status(403).json({ erro: "Senha incorreta" }); // Retorna erro se a senha estiver incorreta
    res.json({ sucesso: true }); // Retorna sucesso se a senha estiver correta
  });
});

// Inicia o servidor na porta definida
app.listen(PORT, () => {
  console.log("Servidor rodando em http://localhost:" + PORT); // Exibe mensagem indicando que o servidor está rodando
});