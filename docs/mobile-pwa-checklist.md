# Mobile/PWA Gate

Use este checklist antes de liberar uma versao para alunos e personals.

## Comandos obrigatorios

```bash
npm run lint
npm run typecheck
npm run pwa:check
npm run test:run
npm run build
```

## Validacao manual

- Abrir `https://insanefit.vercel.app/` no iPhone Safari e Android Chrome.
- Conferir login, dashboard do personal, lista de alunos, builder de treino e portal do aluno.
- Testar toque nos botoes do menu inferior, campos de formulario e botao de concluir serie.
- Ativar modo aviao depois de abrir o app e confirmar que a tela principal continua carregando.
- Instalar como app na tela inicial e conferir icone, nome e abertura em tela cheia.
- Voltar online e confirmar que a fila offline sincroniza sem erro persistente no dashboard.

## Criterios de aceite

- Nenhum texto cortado em 360px de largura.
- Nenhum input causa zoom automatico no iOS.
- Menu inferior respeita a area segura do aparelho.
- Manifest possui icones 192x192, 512x512 e maskable.
- Service worker entrega fallback de navegacao para `/index.html`.
