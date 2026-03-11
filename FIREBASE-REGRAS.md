# Configurar regras do Firestore (para cadastrar produtos)

Se ao cadastrar produtos aparecer erro de **permissão** ou **Missing or insufficient permissions**, configure as regras do Firestore:

1. Acesse [Firebase Console](https://console.firebase.google.com) → projeto **applemeninas-app**.
2. No menu lateral: **Firestore Database** → aba **Regras**.
3. Substitua as regras atuais por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /clients/{docId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    match /orders/{docId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

4. Clique em **Publicar**.

Assim, qualquer usuário **logado** (Authentication) poderá ler e escrever em `products`, `clients` e `orders`. O painel admin exige login, então só quem entrar em `/admin/login` terá acesso.
