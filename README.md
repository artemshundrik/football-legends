# Football Legends TMA

Telegram Mini App — карткова гра з легендарними футбольними командами.

## Локальна розробка

### 1. Запустити локальний сервер

```bash
npm run dev
```

Відкриється на `http://localhost:3000/football-legends-tma.html`

### 2. Тестування в браузері (без Telegram)

Просто відкрий `http://localhost:3000/football-legends-tma.html` — все працює, Telegram-специфічні функції (haptics, showConfirm) автоматично вимикаються.

### 3. Тестування як справжній TMA в Telegram

1. Запусти сервер: `npm run dev`
2. В другому терміналі запусти тунель: `npm run dev:tunnel`
3. Скопіюй публічний URL (напр. `https://xxx.loca.lt/football-legends-tma.html`)
4. У BotFather: `/newbot` → `/mybots` → виберіть бота → Bot Settings → Menu Button → Set URL → встав URL
5. Відкрий бота в Telegram і натисни кнопку меню

### Альтернатива тунелю — ngrok

```bash
npx ngrok http 3000
```

## Структура

```
football-legends-tma.html  — весь застосунок (HTML + CSS + JS)
```

Файл повністю self-contained, зовнішні залежності:
- `telegram-web-app.js` — Telegram SDK
- Google Fonts (Bebas Neue, Manrope)
