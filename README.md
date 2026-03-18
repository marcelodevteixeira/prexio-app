# Aplicativo de Comparação de Preços de Supermercado

Um aplicativo completo para ajudar consumidores a economizar nas compras de supermercado através de comparação de preços, radar de promoções e gamificação.

## Funcionalidades

- **Autenticação de Usuários:** Login seguro e perfis personalizados.
- **Listas de Compras:** Crie e gerencie suas listas de compras.
- **Comparação de Mercados:** Descubra em qual mercado sua lista sai mais barata.
- **Radar de Promoções:** Receba alertas de promoções baseados no seu histórico.
- **Leitura de Código de Barras:** Adicione produtos rapidamente escaneando o código de barras.
- **Leitura de Etiqueta de Preço (OCR):** Extraia preços diretamente das prateleiras.
- **Leitura de QR Code de NFC-e:** Importe suas compras escaneando a nota fiscal.
- **Gamificação (Missão Economia):** Ganhe pontos e suba no ranking colaborando com a comunidade.
- **Banco Coletivo de Preços:** Compartilhe preços e ajude outros usuários a economizar.
- **Compartilhamento de Promoções:** Compartilhe promoções encontradas com seus amigos.
- **Modo Claro / Escuro:** Interface adaptável à sua preferência.

## Arquitetura

O projeto foi estruturado para ser uma aplicação web moderna, escalável e de alta performance.

- **Frontend:** Next.js (React), Tailwind CSS, Framer Motion
- **Backend/API:** Next.js API Routes
- **Banco de Dados & Autenticação:** Supabase (PostgreSQL)
- **Deploy:** Vercel

## Tecnologias Usadas

- React
- Next.js
- Supabase
- Tailwind CSS
- Lucide React (Ícones)
- Framer Motion (Animações)
- Html5Qrcode (Scanner)
- Tesseract.js (OCR)

## Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/seu-repositorio.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env.local`
   - Preencha as variáveis com as credenciais do seu projeto Supabase.

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse `http://localhost:3000` no seu navegador.

## Como conectar o Supabase

1. Crie uma conta no [Supabase](https://supabase.com/).
2. Crie um novo projeto.
3. Vá em **SQL Editor** e execute o script contido em `/database/schema.sql` para criar as tabelas e políticas de segurança (RLS).
4. Vá em **Project Settings > API** e copie a `Project URL` e a `anon public key`.
5. Cole essas credenciais no seu arquivo `.env.local`.

## Como fazer deploy no Vercel

1. Crie uma conta na [Vercel](https://vercel.com/).
2. Conecte sua conta do GitHub.
3. Importe o repositório do projeto.
4. Na etapa de configuração, adicione as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.).
5. Clique em **Deploy**.

O Vercel detectará automaticamente que é um projeto Next.js e usará as configurações do arquivo `vercel.json`.

---

**Author:** Marcelo Teixeira

.

