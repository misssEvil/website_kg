# Сайт Екатерины Глебовой — инструкции для Claude Code

- Источник правды по дизайну: `design/Ekaterina Glebova Site.dc.html` + `design/README.md`. Это HTML-референс, не продакшн-код — пересобираем его как статический сайт.
- Стек: Vite + чистые HTML/CSS/JS. Без фреймворков, без UI-библиотек.
- Тексты переносить дословно, не переписывать.
- Палитра: терракота (см. README → Design Tokens). Голубого в проекте больше нет.
- Брейкпоинты: phone <600, tablet portrait 600–1024, tablet landscape 1025–1366 + (pointer: coarse), desktop — остальное. Hero — 4 отдельных лейаута.
- Фото hero (`hero-cutout.png`) визуально не обрабатывать: без масок, блюра, фильтров, обрезки.
- Все анимации сохранить; уважать `prefers-reduced-motion`; курсор/magnetic/spotlight — только для мыши.
- Перед коммитом проверять все 5 размеров: 1553, 1366, 1024, 768, 390.
- Деплой: GitHub Actions → GitHub Pages (или Vercel/Netlify — уточнить у владельца).
