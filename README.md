# Екатерина Глебова — сайт психолога

Одностраничный лендинг. Vite + чистые HTML/CSS/JS, без фреймворков.

## Запуск

```bash
npm install
npm run dev
```

Сборка в `dist/`:

```bash
npm run build
```

## Настройка

`.env`:

- `VITE_TELEGRAM_URL` — ссылка на Telegram терапевта. Все кнопки «Записаться на консультацию» и «Узнать доступные опции» ведут сюда.
- `VITE_SITE_URL` — публичный адрес сайта без слэша в конце (для canonical, `og:url`, `og:image`).

## Что осталось сделать (контент)

- [ ] Telegram-ссылка в `.env`
- [ ] Публичный адрес сайта в `.env`
- [ ] 5 скриншотов отзывов → `public/assets/reviews/`, заменить плейсхолдеры в `index.html` (блок REVIEWS)
- [ ] Политика конфиденциальности: заполнить выделенные места в `privacy.html`, проверить с юристом
- [ ] OG-картинка 1200×630 для превью в мессенджерах (сейчас используется `contact.png`)
- [ ] Уточнить у заказчика «Конфеденциально» в hero (так в макете)
- [x] Хостинг: GitHub Pages (см. «Деплой»)

## Структура

- `index.html` — вся страница, разбита HTML-комментариями по блокам
- `privacy.html` — политика конфиденциальности
- `src/style.css` — стили; брейкпоинты через `html[data-bp]`
- `src/main.js` — анимации и поведение
- `public/assets/` — изображения, оригиналы без обработки
- `design_handoff_site/` — дизайн-референс и макеты (не публикуется)

## Деплой

Сайт публикуется на GitHub Pages через GitHub Actions (`.github/workflows/deploy.yml`): каждый push в `main` собирает `dist/` и выкладывает его.

Один раз: в репозитории Settings → Pages → Build and deployment → Source: **GitHub Actions**.

Перед первым деплоем заполнить `.env`:

- `VITE_TELEGRAM_URL` — ссылка на Telegram терапевта
- `VITE_SITE_URL` — адрес сайта, например `https://<user>.github.io/<repo>` (без слэша в конце)
