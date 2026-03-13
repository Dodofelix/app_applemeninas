# Regras do Firestore — Apple Meninas (atualizado)

Configure as regras no Firebase para o app funcionar (formulário público + painel admin).

1. Acesse [Firebase Console](https://console.firebase.google.com) → projeto **applemeninas-app**.
2. No menu lateral: **Firestore Database** → aba **Regras**.
3. **Substitua todas as regras** pelo bloco abaixo e clique em **Publicar**.

---

## Regras completas (copie e cole)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isLoggedIn() {
      return request.auth != null;
    }

    // Produtos — leitura pública (formulário), escrita só admin
    match /products/{docId} {
      allow read: if true;
      allow create, update, delete: if isLoggedIn();
    }

    // Clientes — formulário pode criar; admin lê/edita/exclui
    match /clients/{docId} {
      allow create: if true;
      allow read, update, delete: if isLoggedIn();
    }

    // Pedidos — formulário pode criar; admin lê/edita/exclui
    match /orders/{docId} {
      allow create: if true;
      allow read, update, delete: if isLoggedIn();
    }

    // Saídas (fluxo de caixa) — só admin
    match /expenses/{docId} {
      allow read, write: if isLoggedIn();
    }

    // Configurações (taxas gateway + calculadora) — leitura pública, escrita admin
    match /settings/{docId} {
      allow read: if true;
      allow write: if isLoggedIn();
    }

    // Perfil do usuário admin — só o próprio usuário
    match /userProfiles/{userId} {
      allow read, write: if isLoggedIn() && request.auth.uid == userId;
    }

    // Demandas (board Trello) — só admin
    match /demandColumns/{docId} {
      allow read, write: if isLoggedIn();
    }
    match /demandCards/{docId} {
      allow read, write: if isLoggedIn();
    }
  }
}
```

---

## Resumo por coleção

| Coleção         | Leitura pública | Criação pública | Leitura/escrita admin |
|-----------------|-----------------|------------------|------------------------|
| `products`      | Sim             | Não              | Sim                    |
| `clients`       | Não             | Sim              | Sim                    |
| `orders`        | Não             | Sim              | Sim                    |
| `expenses`      | Não             | Não              | Sim                    |
| `settings`      | Sim             | Não              | Sim                    |
| `userProfiles`  | Não             | Não              | Só o próprio usuário   |
| `demandColumns` | Não             | Não              | Sim                    |
| `demandCards`   | Não             | Não              | Sim                    |

Assim o formulário público (`/preencher-pedido`) consegue criar clientes e pedidos e ler produtos e taxas; o restante fica restrito a quem estiver logado no admin.
