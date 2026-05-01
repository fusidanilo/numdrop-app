# NumDrop App

Mobile game realizzato con Expo e React Native.

## Stack

- Expo SDK 52
- React Native 0.76
- TypeScript
- Expo Router
- Zustand (state management)

## Requisiti

- Node.js 20+
- Yarn 1.x
- EAS CLI (per build/release)

## Setup locale

```bash
yarn install
```

In alternativa:

```bash
npm install
```

## Avvio in sviluppo

- Avvio standard:

```bash
yarn start
```

- Android:

```bash
yarn android
```

- iOS:

```bash
yarn ios
```

- Web:

```bash
yarn web
```

## Qualita' codice

```bash
yarn lint
```

## Build/Release con EAS (manuale)

Profili disponibili in `eas.json`:

- `development`
- `preview` (test/staging)
- `production`

Esempi:

```bash
eas build --platform android --profile preview
eas build --platform ios --profile production
```

## CI/CD GitHub Actions

Workflow: `.github/workflows/mobile-cicd.yml`

### Trigger automatici

- Push su `staging`:
  - build + submit Android/iOS con profilo EAS `preview`
- Push su `master`:
  - build + submit Android/iOS con profilo EAS `production`

### Trigger manuale

Da GitHub Actions puoi avviare il workflow con:

- `channel`: `staging` o `production`
- `platform`: `all`, `android`, `ios`

## Secrets/Configurazioni richieste su GitHub

Nel repository (`Settings > Secrets and variables > Actions`):

- `EXPO_TOKEN` (obbligatorio)

Inoltre, su Expo/EAS devono essere gia' configurate le credenziali:

- Android (Google Play)
- iOS (App Store Connect / Apple)

## Struttura progetto (principale)

- `src/app/` route Expo Router (re-export verso le feature)
- `src/features/<feature>/` con `screens/`, `styles/` (stessi livello), `hooks/` e `components/` dove serve
- `src/game/` dominio di gioco (engine, config, store, utils) usato dalle feature
- `src/styles/` stili condivisi (es. layout radice)
- `assets/` immagini e asset statici
- `eas.json` profili build/submit EAS
- `.github/workflows/` pipeline CI/CD

